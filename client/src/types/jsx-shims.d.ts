// Temporary type definitions for .jsx and .js files during migration
// TODO: Remove after converting all files to TypeScript

declare module '*.jsx' {
  import React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module '*.js' {
  const content: any;
  export default content;
  export * from content;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

