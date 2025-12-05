import React from 'react';

const GlobalStyles = () => (
  <style>{`
    /* Import Space Grotesk Font */
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
    
    body {
      font-family: 'Space Grotesk', sans-serif;
      background-color: #F3F3F3;
      color: #191A23;
      margin: 0;
      padding: 0;
    }

    /* Apply font to all elements to ensure consistency */
    * {
      font-family: 'Space Grotesk', sans-serif;
      box-sizing: border-box;
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #F3F3F3; }
    ::-webkit-scrollbar-thumb { background: #191A23; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }
  `}</style>
);

export default GlobalStyles;