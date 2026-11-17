# Fire detection image explorer

A React and TypeScript prototype for inspecting bounding boxes returned by the hosted Roboflow model `fire-detection-g9ebb/8`. Upload a JPEG or PNG, run inference, and inspect the provider's class labels and confidence values. Predictions use the image coordinate system and follow its aspect ratio when the viewport changes.

## Run locally

Install dependencies with `npm ci`. Set `ROBOFLOW_API_KEY` in your shell and run `npm run dev`. Open **http://127.0.0.1:8080**. Selecting an image previews it locally. Choosing **Analyze Image** sends it to Roboflow through the local server and may consume provider quota. The credential stays in the server process.

The static build supports image preview. Live inference requires the local development server. The repository contains integration code. Model training, field evaluation and emergency alerting are outside its scope.
