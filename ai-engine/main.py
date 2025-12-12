import json
import os
from datetime import datetime

import google.generativeai as genai
import typing_extensions as typing
from fastapi import FastAPI, File, HTTPException, UploadFile
from faster_whisper import WhisperModel

# --- CONFIGURATION ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print("WARNING: GOOGLE_API_KEY is missing")

genai.configure(api_key=GOOGLE_API_KEY)

app = FastAPI()

print("Chargement du modèle Whisper...")
whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
print("Modèle chargé !")


# --- 1. DÉFINITION DU SCHÉMA (Mise à jour) ---
class TaskSchema(typing.TypedDict):
    description: str
    status: str
    deadline: str


class TradeSchema(typing.TypedDict):
    trade_name: str
    tasks: list[TaskSchema]


class SiteReportSchema(typing.TypedDict):
    project_name: str
    date: str
    general_notes: str
    trades: list[TradeSchema]
    formatted_report: str


# --- ROUTES ---


@app.get("/")
def health_check():
    return {"status": "AI Engine Ready"}


@app.post("/transcribe")
async def process_audio(file: UploadFile = File(...)):
    temp_filename = f"temp_{file.filename}"

    try:
        # 1. Sauvegarde
        with open(temp_filename, "wb") as buffer:
            buffer.write(await file.read())

        # 2. Transcription
        segments, _ = whisper_model.transcribe(
            temp_filename, beam_size=5, language="fr"
        )
        raw_text = "".join([segment.text for segment in segments]).strip()
        current_date = datetime.now().strftime("%Y-%m-%d")

        # 3. Intelligence (Gemini 2.5 Flash)
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""
        CONTEXT TEMPOREL : nous sommes le {current_date}
        Tu es un architecte senior expert en BTP.
        Ton rôle est double :
        1. Extraire les données structurées du chantier.
        2. Rédiger un script de compte rendu professionnel prêt à l'envoi.

        Voici la transcription brute : "{raw_text}"

        Instructions pour le champ 'formatted_report' :
        - Rédige un compte rendu textuel complet au format Markdown.
        - Utilise un ton très professionnel, direct et factuel.
        - Utilise du **gras** pour les points critiques.
        - Fais des listes à puces pour les actions par lot.

        Instructions pour les champs JSON :
        - Sois strict sur les dates.
        """

        result = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json", response_schema=SiteReportSchema
            ),
        )

        # Analytics
        usage = result.usage_metadata
        prompt_tokens = usage.prompt_token_count
        output_tokens = usage.candidates_token_count
        total_tokens = usage.total_token_count

        structured_data = json.loads(result.text)

        return {
            "raw_transcription": raw_text,
            "structured_report": structured_data,
            "usage": {
                "prompt_tokens": prompt_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
            },
        }

    except Exception as e:
        print(f"Error AI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
