import React, { useContext, useState } from 'react';
import { UserContext } from '../../../UserContext';
import styles from './UserBadge.module.css';

export default function UserBadge() {
  const { user } = useContext(UserContext);
  const [imageError, setImageError] = useState(false);

  if (!user) return null;

  const hasAvatar = user.thumbnailURLString && !imageError;
  const avatarInitial = user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.wrapper} title={`${user.nickname} (${user.id})`}>
      {hasAvatar ? (
        <img 
          className={styles.avatar} 
          src={user.thumbnailURLString} 
          alt="avatar"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={styles.avatarPlaceholder}>
          {avatarInitial}
        </div>
      )}
      <div className={styles.textCol}>
        <div className={styles.nick}>{user.nickname}</div>
        <div className={styles.id}>@{user.id}</div>
      </div>
    </div>
  );
}