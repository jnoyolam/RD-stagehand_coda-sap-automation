from langchain_openai import AzureChatOpenAI

AZURE_OPENAI_ENDPOINT = "https://genaiapimna.jnj.com/openai-chat"
API_KEY = "76cf7f1a70af43e98c530f172887fac4"
DEPLOYMENT = "gpt-4o"
API_VERSION = "2024-10-21"

llm = AzureChatOpenAI(
    api_key=API_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version=API_VERSION,
    azure_deployment=DEPLOYMENT,
)

response = llm.invoke("Tell me what is a llm as if I am 10 year old.")
print(response)