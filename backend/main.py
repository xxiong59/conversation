# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from google import genai
from google.genai import types
import whisper
import time
from TTS.api import TTS
from fastapi.staticfiles import StaticFiles
import os
import base64
import uuid

# Initialize FastAPI app
app = FastAPI(title="Simple API", description="A simple REST API using FastAPI")

tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)

# 获取当前文件的目录
current_dir = os.path.dirname(os.path.abspath(__file__))
# 获取上一级目录中的temp_audio文件夹的绝对路径
audio_dir = os.path.abspath(os.path.join(current_dir, "..", "temp_audio"))

# 确保目录存在
os.makedirs(audio_dir, exist_ok=True)

# 挂载静态文件夹
app.mount("/audio", StaticFiles(directory=audio_dir), name="audio")

client = genai.Client(api_key="AIzaSyBZOeQvN2P8C_mv9u4xFqR-kdGuk0FPT4M")

chat = client.chats.create(
     model="gemini-2.0-flash",
     config=types.GenerateContentConfig(
        system_instruction="You are chat robot, you need to chat with others like a real friend using plain and simple answer. Dont use sepcial characters, only contains english!"))

# Add CORS middleware to allow cross-origin requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Sample data store (in-memory database)
items = []

# Data models
class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: float
    is_available: bool = True


# Routes
@app.get("/")
async def root():
    return {"message": "Welcome"}

class TextRequest(BaseModel):
    text: str

class AudioRequest(BaseModel):
    text: str

class VideoRequest(BaseModel):
    text: str

@app.post("/text")
async def getText(request: TextRequest):
    response = chat.send_message(request.text)

    text_response = response.text

    file_id = str(uuid.uuid4())
    file_name = f"{file_id}.wav"
        
    # 使用正确的绝对路径保存文件
    output_path = os.path.join(audio_dir, file_name)
        
     # 使用TTS生成音频
    tts.tts_to_file(text=text_response, file_path=output_path)    

    with open(output_path, 'rb') as audio_file:
        audio_data = audio_file.read()
    
    # 将音频数据编码为base64
    base64_audio = base64.b64encode(audio_data).decode('utf-8')
    
    return {
        "text": text_response,
        "audio_base64": base64_audio,
        "success": True
    }

@app.post("/audio")
async def getAudio(request: AudioRequest):
    print(f"Received request.text with length: {len(request.text) if request.text else 0}")

    audio_bytes = base64.b64decode(request.text)
    # response = client.models.generate_content(
    #     model='gemini-2.0-flash',
    #     contents=[
    #         'your are an friendly assistant answering people\'s questions',
    #         types.Part.from_bytes(
    #             data=audio_bytes,
    #             mime_type='audio/wav',
    #         )
    #     ]
    # )

    # response = chat.send_message([
    #      {
    #         "mime_type": "audio/wav",  # 更改为您的音频文件类型
    #         "data": request.text
    #      },
    #      "Give me an answer according to the audio content"
    # ])
    ori_file_id = str(uuid.uuid4())
    ori_file_name = f"{ori_file_id}.wav"
    ori_output_path = os.path.join(audio_dir, ori_file_name)
    await base64_to_wav(audio_bytes, ori_output_path)
    ori_text = await transcribe_audio(ori_output_path)

    
    response = chat.send_message(ori_text)
    text_response = response.text

    file_id = str(uuid.uuid4())
    file_name = f"{file_id}.wav"
        
    # 使用正确的绝对路径保存文件
    output_path = os.path.join(audio_dir, file_name)
        
     # 使用TTS生成音频
    # tts.tts_to_file(text=text_response, file_path=output_path)
    await safe_tts_to_file(tts, text_response, file_path=output_path)

    with open(output_path, 'rb') as audio_file:
        audio_data = audio_file.read()
    
    # 将音频数据编码为base64
    base64_audio = base64.b64encode(audio_data).decode('utf-8')
    
    return {
        "ori_text": ori_text,
        "text": text_response,
        "audio_base64": base64_audio,
        "success": True
    }

@app.post("/video")
async def getVideo(request: VideoRequest):
    print(f"Received request.text with length: {len(request.text) if request.text else 0}")

    video_bytes = base64.b64decode(request.text)
    # ori_file_id = str(uuid.uuid4())
    # ori_file_name = f"{ori_file_id}.wav"
    # ori_output_path = os.path.join(audio_dir, ori_file_name)
    # # await base64_to_wav(audio_bytes, ori_output_path)
    # # ori_text = await transcribe_audio(ori_output_path)
    start_time = time.time()
    summary = client.models.generate_content(
        model='models/gemini-2.0-flash',
        contents=types.Content(
            parts=[
                types.Part(text='Can you summarize this video and get the question in the video?'),
                types.Part(
                    inline_data=types.Blob(data=video_bytes, mime_type='video/mp4')
                )
            ]
        )
    )
    end_time = time.time()
    print(f"summary Time: {end_time - start_time:.2f} seconds")
    
    start_time1 = time.time()
    response = chat.send_message(summary.text)
    end_time1 = time.time()
    print(f"response Time: {end_time1 - start_time1:.2f} seconds")
    text_response = response.text

    file_id = str(uuid.uuid4())
    file_name = f"{file_id}.wav"
        
    # 使用正确的绝对路径保存文件
    output_path = os.path.join(audio_dir, file_name)
        
     # 使用TTS生成音频
    # tts.tts_to_file(text=text_response, file_path=output_path)
    await safe_tts_to_file(tts, text_response, file_path=output_path)

    with open(output_path, 'rb') as audio_file:
        audio_data = audio_file.read()
    
    # 将音频数据编码为base64
    base64_audio = base64.b64encode(audio_data).decode('utf-8')
    
    return {
        "ori_text": summary.text,
        "text": text_response,
        "audio_base64": base64_audio,
        "success": True
    }

async def base64_to_wav(audio_bytes, output_file):
    # Remove the header if it exists (e.g., "data:audio/wav;base64,")
    # if isinstance(audio_bytes, str):
    #     # Remove the header if it exists (e.g., "data:audio/wav;base64,")
    #     if "," in audio_bytes:
    #         audio_bytes = audio_bytes.split(",")[1]
    #     # Decode the base64 string to bytes
    #     wav_data = base64.b64decode(audio_bytes)
    # else:
    #     # It's already bytes, so use it directly
    #     wav_data = audio_bytes
    
    # Write the binary data to a WAV file
    with open(output_file, 'wb') as file:
        file.write(audio_bytes)
    
    print(f"WAV file saved as {output_file}")



async def transcribe_audio(file):
        start_time = time.time()
        model = whisper.load_model("base")  # 可以选择 small, medium, large 等模型
        result = model.transcribe(file)
        end_time = time.time()
        print(f"TTS Time: {end_time - start_time:.2f} seconds")
        return result["text"]
    
async def tts_trans(audio_text: str):
        # Get device
        # device = "cuda" if torch.cuda.is_available() else "cpu"

        # # List available 🐸TTS models
        # print(TTS().list_models())

        # # Init TTS
        # tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

        # # Run TTS
        # # ❗ Since this model is multi-lingual voice cloning model, we must set the target speaker_wav and language
        # # Text to speech list of amplitude values as output
        # wav = tts.tts(text="Hello world!", speaker_wav="my/cloning/audio.wav", language="en")
        # # Text to speech to a file
        # tts.tts_to_file(text="Hello world!", speaker_wav="my/cloning/audio.wav", language="en", file_path="output.wav")
        tts.tts_to_file(text=audio_text, file_path="output.wav")

async def safe_tts_to_file(tts, text, file_path):
    # Minimum length for Tacotron2 to work reliably
    MIN_TEXT_LENGTH = 10
    
    if len(text) < MIN_TEXT_LENGTH:
        # Option 1: Pad the text
        padded_text = text + " " * (MIN_TEXT_LENGTH - len(text))
        tts.tts_to_file(text=padded_text, file_path=file_path)
        
        # Option 2: Use a pre-recorded short response
        # shutil.copyfile("path/to/short_response.wav", file_path)
        
        # Option 3: Use a simpler TTS method for very short texts
        # ... alternative TTS method ...
    else:
        tts.tts_to_file(text=text, file_path=file_path)





# Run the app with uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)