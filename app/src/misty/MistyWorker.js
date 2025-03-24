import { behaviors } from "./behaviorDefinition.js";

let currentVolume = 10;
let videoSocket = null;
let isVideoStreaming = false;

const emotionToBehavior = {
    annoyed: 'annoyance',
    anticipation: 'anticipation',
    apprehension: 'apprehension',
    bored: 'boredom',
    dancing: 'dancing',
    disgust: 'disgust',
    distracted: 'distraction',
    ecstatic: 'ecstasy',
    elicit: 'elicit',
    fear: 'fear',
    grief: 'grief',
    interest: 'interest',
    joy: 'joy',
    loathing: 'loathing',
    pensive: 'pensiveness',
    rage: 'rage',
    sad: 'sadness',
    serene: 'serenity',
    sleepy: 'sleepy',
    spooked: 'spooked',
    surprised: 'surprise',
    terror: 'terror',
    trust: 'trust',
    vigilant: 'vigilance',
    default: 'default'
};

export class MistyApi {
    constructor(ip) {
        this.socket = null;
        this.ipAddress = ip;
        this.audioCallbacks = [];

        // 将方法绑定到实例
        this.connect2Misty = this.connect2Misty.bind(this);
        this.registerForAudioPlayComplete = this.registerForAudioPlayComplete.bind(this);
        this.registerForBumpSensor = this.registerForBumpSensor.bind(this);
        this.registerAudioCallback = this.registerAudioCallback.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.uploadAudio = this.uploadAudio.bind(this);
        this.playAudio = this.playAudio.bind(this);
        this.deleteAudio = this.deleteAudio.bind(this);
        this.startVideoStreaming = this.startVideoStreaming.bind(this);
        this.stopVideoStreaming = this.stopVideoStreaming.bind(this);
        this.getVideoRecordingsList = this.getVideoRecordingsList.bind(this);
        this.handleBumpSensorEvent = this.handleBumpSensorEvent.bind(this);
        
        // this.connect2Misty(ip);
    }

    connect2Misty() {
        const ip = this.ipAddress;
        this.socket = new WebSocket(`ws://${ip}/pubsub`);

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            // You can send an initial command or subscribe to events here
            setTimeout(() => {
                // Now it's safe to register for events
                this.registerForAudioPlayComplete();
                this.registerForBumpSensor();
                this.playAudio("mario_bros_coin.mp3");
                this.getVideoRecordingsList();
            }, 500);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.socket.onclose = () => {
            console.log('WebSocket closed');
        };

        this.socket.onmessage = (event) => {
            console.log('Message from server:', event.data);
            // Handle incoming messages from the robot
            this.handleMessage(event.data);
        };
    }

    registerForAudioPlayComplete() {
        const subscribeMsg = {
            Operation: 'subscribe',
            Type: 'AudioPlayComplete',
            DebounceMs: 0,
            EventName: 'AudioPlayComplete',
            ReturnProperty: null,
            EventConditions: []
        };
        this.audioCallbacks.forEach(callback => callback());
        this.socket.send(JSON.stringify(subscribeMsg));
    }
    
    registerForBumpSensor() {
        const subscribeMsg = {
            Operation: 'subscribe',
            Type: 'BumpSensor',
            DebounceMs: 0,
            EventName: 'BumpSensor',
            ReturnProperty: null,
            EventConditions: []
        };
        this.socket.send(JSON.stringify(subscribeMsg));
    }

    registerAudioCallback(callback) {
        this.audioCallbacks.push(callback);
    }

    handleMessage(data) {
        const message = JSON.parse(data);
        switch (message.eventName) {
            case 'AudioPlayComplete':
                if (message.message && message.message.metaData) {
                    console.log('Audio playback completed');
                    if(message.message.metaData.name !== "mario_bros_coin.mp3") {
                        this.deleteAudio(message.message.metaData.name);
                    }
                } else {
                    console.log('AudioPlayComplete registration status received');
                }
                break;
            case 'BumpSensor':
                this.handleBumpSensorEvent(message);
                break;
            case '':
                break;    
            default:
                console.log('Misty message ${message} ');
                break;
        }
    }

    async uploadAudio(base64AudioData, filename) {
        const uploadResponse = await fetch(`http://${this.ipAddress}/api/audio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                FileName: filename,
                Data: base64AudioData,
                OverwriteExisting: true,
            })
        });

        console.log("Upload Response from teh Upload audio function : ", uploadResponse);
    
        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload audio: ${uploadResponse.statusText}`);
        }
    }

    async playAudio(filename) {
        const playResponse = await fetch(`http://${this.ipAddress}/api/audio/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ AssetId: filename, volume: currentVolume })
        });
    
        if (!playResponse.ok) {
            throw new Error(`Failed to play audio: ${playResponse.statusText}`);
        }
    }

    async deleteAudio(filename) {
        try {
            const response = await fetch(`http://${this.ipAddress}/api/audio`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ FileName: filename })
            });
        
            if (!response.ok) {
                throw new Error(`Failed to delete audio: ${response.statusText}`);
            }
        
            const result = await response.json();
            console.log("Successfully deleted file:", result, filename);
            return result.result;
        } catch (error) {
            console.error('Error deleting audio:', error);
            throw error;
        }
    }

    async startRecordAudio(filename) {
        try {
            const response = await fetch(`http://${this.ipAddress}/api/audio/record/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ FileName: filename })
            })
            if (!response.ok) {
                throw new Error(`Failed to delete audio: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting audio:', error);
            throw error;
        }
    }

    async stopRecordAudio() {
        try {
            const response = await fetch(`http://${this.ipAddress}/api/audio/record/stop`, {
                method: 'POST',
            })
            if (!response.ok) {
                throw new Error(`Failed to delete audio: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting audio:', error);
            throw error;
        }
    }

    async getRecordAudio(filename) {
        try {
            const base64Param = "&Base64=true";
            const url = `http://${this.ipAddress}/api/audio?FileName=${filename}${base64Param}`;
            
            // Make the API request
            const response = await fetch(url, {
                method: 'GET',
            });
            if (!response.ok) {
                throw new Error(`Failed to get audio: ${response.status} ${response.statusText}`);
            }
            const responseData = await response.json();
            
            console.log("Parsed response data:", responseData);
            return responseData.result.base64;
        } catch (error) {
            console.error("Error retrieving audio:", error);
            throw error;
        }
    }

    async startRecordVideo(filename, mute, duration, width, height) {
        try {
            const response = await fetch(`http://${this.ipAddress}/api/videos/recordings/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "FileName": filename,
                    "Mute": mute,
                    "Duration": duration,
                    "Width": width,
                    "Height": height })
            })
            if (!response.ok) {
                throw new Error(`Failed to delete audio: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting audio:', error);
            throw error;
        }

    }

    async stopRecordVideo() {
        try {
            const response = await fetch(`http://${this.ipAddress}/api/videos/recordings/stop`, {
                method: 'POST',
            })
            if (!response.ok) {
                throw new Error(`Failed to delete audio: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting audio:', error);
            throw error;
        }
    }

    async getRecordVideo(filename) {
        try {
            const filenameParam = "Name=" + filename
            const base64Param = "&Base64=true";
            const url = `http://${this.ipAddress}/api/videos/recordings?${filenameParam}${base64Param}`;
            
            // Make the API request
            const response = await fetch(url, {
                method: 'GET',
            });
            if (!response.ok) {
                throw new Error(`Failed to get audio: ${response.status} ${response.statusText}`);
            }
            const responseData = await response.json();
            
            console.log("Parsed response data:", responseData);
            return responseData.result.base64;
        } catch (error) {
            console.error("Error retrieving audio:", error);
            throw error;
        }
    }

    async startVideoStreaming(processFrameCallback) {
        try {
            const response = await fetch(`http://${this.ipAddress}/api/videostreaming/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "Port": 6789,
                    "Rotation": 0,
                    "Width": 640,  // 可调整为你需要的分辨率
                    "Height": 480, // 可调整为你需要的分辨率
                    "Quality": 75, // 画质与性能的平衡
                    "Overlay": false
                })
            });
        
            const data = await response.json();
            
            if (data.result) {
                videoSocket = new WebSocket(`ws://${this.ipAddress}:6789`);
                console.log(data);
                videoSocket.onopen = () => {
                    console.log('Connected to video stream');
                    isVideoStreaming = true;
                };
            
                videoSocket.onmessage = (event) => {
                    if (typeof processFrameCallback === 'function') {
                        processFrameCallback(event.data);
                    }
                };
            
                videoSocket.onerror = (error) => {
                    console.error('Video WebSocket error:', error);
                };
            
                videoSocket.onclose = () => {
                    console.log('Video WebSocket closed');
                    isVideoStreaming = false;
                };
                return true;
            } else {
                console.error("启动视频流失败:", data);
                return false;
            }
        } catch (error) {
            console.error("启动视频流时出错:", error);
            return false;
        }
    }

    async stopVideoStreaming() {
        try {
            const response = await fetch(`http://${this.ipAddress}/api/videostreaming/stop`, {
                method: 'POST'
            });
          
            const data = await response.json();
            console.log("视频流已停止:", data);
            return true;
        } catch (error) {
            console.error("停止视频流时出错:", error);
            return false;
        }
    }

    async getVideoRecordingsList() {
        try {
            const response = await fetch(`http://${this.ipAddress}/api/videos/recordings/list`, {
                method: 'GET'
            });
            
            const data = await response.json();
            console.log("getVideoRecordingsList:", data);
            return true;
        } catch (error) {
            console.error("getVideoRecordingsList:", error);
            return false;
        }
    }

    handleBumpSensorEvent(data) {
        if (data.message && data.message.isContacted) {
            const sensorId = data.message.sensorId;
            let bumpSensor;
        
            //the placement of the robot changes the bumper mapping
            switch (sensorId) {
                case 'bfl':
                case 'brl':
                    bumpSensor = 'RightBumper';
                    break;
                case 'bfr':
                case 'brr':
                    bumpSensor = 'LeftBumper';
                    break;
                default:
                    console.log('Unknown bump sensor:', sensorId);
                    break;
            }
        }
    }
}