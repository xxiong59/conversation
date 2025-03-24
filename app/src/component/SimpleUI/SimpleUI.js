import React, { useState } from 'react';
import getMistyInstance from '../../misty/MistyProvider';

const SimpleInterface = () => {
  const [displayText, setDisplayText] = useState('在这里显示文本内容');
  const [inputText, setInputText] = useState('');
  const [isHandlingAudio, setIsHandlingAudio] = useState();
  const [isHandlingVideo, setIsHandlingVideo] = useState();
  

  const handleSubmit = async() => {
    if (inputText.trim()) {
      setDisplayText(inputText);
      setInputText('');
      const misty = getMistyInstance("")
      const audio = await sendText2AI(inputText)
      const timestamp = Date.now();
      const filename = `a_xxiong59_test_${timestamp}.wav`;
      await misty?.uploadAudio(audio, filename)
      await misty?.playAudio(filename)
    }
  };

  const handleClear = () => {
    setDisplayText('');
    setInputText('');
  };

  const handleAudio = async () => {
    const misty = getMistyInstance("")
    if (isHandlingAudio) {
      await misty?.stopRecordAudio()
    
      setTimeout(() => {
        console.log("wait get record audio");
      }, 1000);
      const filename = `a_xxiong59__record_test.wav`;
      const base64 = await misty?.getRecordAudio(filename);
      console.log("getRecordAudio data:", base64);
      const audio = await sendAudio2AI(base64);
      const timestamp = Date.now();
      const filename2 = `a_xxiong59_test_${timestamp}.wav`;
      await misty?.uploadAudio(audio, filename2);
      await misty?.playAudio(filename2);
    } else {
      const filename = `a_xxiong59__record_test.wav`;
      await misty?.startRecordAudio(filename)
    }
    setIsHandlingAudio(!isHandlingAudio)
    
  };

  const handleVideo = async() => {
    const misty = getMistyInstance("")
    if (isHandlingVideo) {
      await misty?.stopRecordVideo()
      setTimeout(() => {
        console.log("wait get record audio");
      }, 1000);
      const filename = `a_xxiong59__record__video_test`;
      const base64 = await misty?.getRecordVideo(filename);
      const audio = await sendVideo2AI(base64);
      const timestamp = Date.now();
      const filename2 = `a_xxiong59_test_${timestamp}.wav`;
      await misty?.uploadAudio(audio, filename2);
      await misty?.playAudio(filename2);
    } else {
      const filename = `a_xxiong59__record__video_test`;
      await misty?.startRecordVideo(filename, false, 60, 1920, 1080)
    }
    setIsHandlingVideo(!isHandlingVideo)
  };

  const sendText2AI = async(text) => {
    const res = await fetch('http://localhost:8000/text', {
      method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });
    const data = await res.json();

    setDisplayText(data["text"])
    return data["audio_base64"]
  }

  const sendAudio2AI = async(base64) => {
    const res = await fetch('http://localhost:8000/audio', {
      method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: base64 }),
    });
    const data = await res.json();
    const text = "Q:" + data["ori_text"] + "\n" + "A:" + data["text"]
    setDisplayText(text)
    return data["audio_base64"]
  }

  const sendVideo2AI = async(base64) => {
    const res = await fetch('http://localhost:8000/video', {
      method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: base64 }),
    });
    const data = await res.json();
    const text = "Q:" + data["ori_text"] + "\n" + "A:" + data["text"]
    setDisplayText(text)
    return data["audio_base64"]
  }

  // 内联样式
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '16px'
    },
    card: {
      width: '100%',
      maxWidth: '500px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      margin: '16px'
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '16px'
    },
    displayContainer: {
      marginBottom: '24px'
    },
    displayArea: {
      width: '100%',
      height: '192px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      overflowY: 'auto'
    },
    text: {
      whiteSpace: 'pre-line'
    },
    inputContainer: {
      width: '100%'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    input: {
      width: '100%',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      outline: 'none'
    },
    buttonGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px'
    },
    button: {
      padding: '8px 16px',
      color: 'white',
      borderRadius: '8px',
      cursor: 'pointer',
      border: 'none',
      outline: 'none'
    },
    submitButton: {
      backgroundColor: '#3b82f6'
    },
    clearButton: {
      backgroundColor: '#6b7280'
    },
    upperCaseButton: {
      backgroundColor: '#10b981'
    },
    lowerCaseButton: {
      backgroundColor: '#8b5cf6'
    }
  };

  // 在较大屏幕上更改按钮网格布局
  if (window.innerWidth >= 640) {
    styles.buttonGrid.gridTemplateColumns = 'repeat(4, 1fr)';
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>conversation with misty</h2>
        
        {/* 中央文本显示框 */}
        <div style={styles.displayContainer}>
          <div style={styles.displayArea}>
            <p style={styles.text}>{displayText}</p>
          </div>
        </div>
        
        {/* 底部输入区域 */}
        <div style={styles.inputContainer}>
          <div style={styles.formGroup}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={styles.input}
              placeholder="请输入文本..."
            />
            
            <div style={styles.buttonGrid}>
              <button
                onClick={handleSubmit}
                style={{...styles.button, ...styles.submitButton}}
              >
                send
              </button>
              <button
                onClick={handleClear}
                style={{...styles.button, ...styles.clearButton}}
              >
                clear
              </button>
              <button
                onClick={handleAudio}
                style={{...styles.button, ...styles.upperCaseButton}}
              >
                audio
              </button>
              <button
                onClick={handleVideo}
                style={{...styles.button, ...styles.lowerCaseButton}}
              >
                video
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleInterface;