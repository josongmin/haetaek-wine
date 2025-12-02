import React, { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';
import { toast } from 'react-hot-toast';
import './Login.css';
import logo from '../resources/icon_red.png';
import { loginUser } from '../api/wineApi';

function Login() {
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext) as { setUser: (user: any) => void };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // localhost 환경에서는 인증 없이 성공 처리
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const mockUser = {
        index: '250',
        id: 'admin@localhost',
        nickname: 'Local Admin',
        expertProfileIndex: 1,
        level: 5,
        point: 0,
        accessToken: 'localhost:dev',
      };
      console.log('Localhost 로그인 우회:', mockUser);
      setUser(mockUser);
      navigate('/');
      return;
    }
    
    try {
      const { code, body, errorMessage } = await loginUser(userId, password);
      
      // 응답 코드에 따른 처리
      if (code === '0') {
        if (!body.expertProfileIndex && !(body.index == 250)) {
          toast.error("전문가 인증이 완료된 후 사용하실 수 있습니다");
          return;
        }

        // 로그인 성공 처리
        console.log('Login successful:', body);
        setUser(body);
        navigate('/');
      } else {
        // 로그인 실패 처리
        console.error('Login failed:', errorMessage);
        toast.error('Login failed: ' + errorMessage);
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      toast.error('Login failed: ' + (error.response ? error.response.data.message : error.message));
    }
  };

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <div className="login-container">
      <img src={logo} alt="aSommGuide" className="logo" />
      <h2>관리자 페이지 로그인</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>아이디(email):</label>
          <input
            type="text"
            name="id"
            value={userId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
            required={!isLocalhost}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required={!isLocalhost}
          />
        </div>
        {isLocalhost && (
          <div style={{ color: '#666', fontSize: '12px', marginBottom: '10px' }}>
            로컬 환경: ID/Password 없이 로그인 가능
          </div>
        )}
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
}

export default Login;

