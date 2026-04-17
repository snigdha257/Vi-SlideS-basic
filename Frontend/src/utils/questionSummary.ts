import axios from "axios";

export async function getQuestionsSummary(sessionCode: string): Promise<string> {
  try {
    const response = await axios.get(`http://localhost:5000/session/${sessionCode}/questions-summary`);
    return response.data.summary || "Unable to generate summary";
  } catch (error) {
    console.error("Error fetching questions summary:", error);
    return "Unable to fetch summary at this moment";
  }
}
