import gradio as gr
from sxudo_core import build_prompt, save_memory
# Hypothetical Ollama Python client (install via `pip install ollama`)
from ollama import generate  

def chat(message, history):
    prompt = build_prompt(message)
    response = generate(model="phi3", prompt=prompt)
    save_memory(message, response)
    return response

gr.ChatInterface(chat).launch(server_name="0.0.0.0", server_port=7860)