import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// React를 전역으로 사용 가능하게 설정
global.React = React;

// 각 테스트 후 cleanup
afterEach(() => {
  cleanup();
});

