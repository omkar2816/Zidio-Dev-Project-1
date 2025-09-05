import React from 'react';

const SimpleTest = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '24px' }}>Simple Test Page</h1>
      <p style={{ color: '#666', fontSize: '16px' }}>
        If you can see this text, React is working and the page is rendering.
      </p>
      <div style={{ 
        backgroundColor: '#10b981', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        React App is functional!
      </div>
    </div>
  );
};

export default SimpleTest;
