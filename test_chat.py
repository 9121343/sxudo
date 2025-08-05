import requests

def test_chat_api():
    url = "http://127.0.0.1:8000/api/chat"
    user_input = "Hello Ollama!"
    response = requests.post(url, data={"user_input": user_input})

    if response.status_code == 200:
        data = response.json()
        print("AI Reply:", data.get("reply"))
    else:
        print(f"Error: {response.status_code}")

if __name__ == "__main__":
    test_chat_api()
