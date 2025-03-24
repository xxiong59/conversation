import './App.css';

import React, { useState, useEffect, useRef } from 'react';
import ControlTray from './component/actionbar/ControlTray';
import SidePanel from './component/sidePanel/SidePanel';
import { Altair } from './component/AltairComponent/AltairComponent';
import SimpleInterface from './component/SimpleUI/SimpleUI';
import getMistyInstance from './misty/MistyProvider'

const App = () => {
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null);

  const misty = getMistyInstance('10.134.71.219')
  const timer = setTimeout(() => {
      misty?.connect2Misty();
  }, 2000);
  
  return (
    <div className="App">
        <SimpleInterface/>
    </div>
  );
};

export default App;
