# Prompt Workbench

A tool for creating, testing, and iterating system prompts with multiple AI providers (Anthropic Claude, OpenAI, Google Gemini).

## Features

- **Project Management**: Organize your prompts into projects
- **Automatic Versioning**: Every change creates a new version with full history
- **Integrated Testing**: Test your prompts directly with AI APIs
- **Multi-Provider Support**: Works with Anthropic, OpenAI, and Google Gemini
- **Dynamic Variables**: Use `{{variable}}` to create reusable prompts
- **AI-Powered Generation**: Generate and improve prompts using feedback
- **Visual Diff**: Compare versions side by side
- **Smart Import/Export**: Merge imports without losing existing data
- **Metrics**: View tokens and response time

## Requirements

- Node.js 18+
- API Key from one of the supported providers:
  - [Anthropic](https://console.anthropic.com/settings/keys)
  - [OpenAI](https://platform.openai.com/api-keys)
  - [Google AI Studio](https://aistudio.google.com/app/apikey)

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/prompt-workbench.git
cd prompt-workbench

# Install dependencies
npm install

# Start development server
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build the project for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable components (Button, Modal, Input...)
│   ├── layout/       # Sidebar, Header
│   ├── prompts/      # Editor, Tester, History, DiffView
│   └── modals/       # NewPromptModal, SettingsModal, ConfirmModal
├── hooks/            # Custom hooks (useWorkbenchData, useAiApi, useToast)
├── services/         # Storage and AI API services
├── types/            # TypeScript interfaces
├── utils/            # Utilities (generateId, version, variables)
├── constants/        # Configuration and constants
└── App.tsx           # Main component
```

## Usage

### 1. Configure API Key

1. Click on **Settings** in the sidebar
2. Select your preferred AI provider
3. Enter your API key for that provider
4. Choose the desired model

### 2. Create a Prompt

1. Click on **Nuevo proyecto** (New project)
2. Click on **Nuevo prompt** (New prompt) within the project
3. Optionally, describe the use case so the AI generates an initial prompt

### 3. Test the Prompt

1. Go to the **Probar** (Test) tab
2. If your prompt has `{{var}}` variables, fill in their values
3. Write the test input
4. Click **Ejecutar** (Run)

### 4. Iterate with Feedback

1. Review the output
2. Write feedback about what to improve
3. Click **Generar nueva versión** (Generate new version)
4. The history keeps all versions

## Supported Models

### Anthropic (Claude)
- Claude Sonnet 4.5
- Claude Sonnet 4
- Claude Opus 4
- Claude Haiku 3.5

### OpenAI
- GPT-4o
- GPT-4o Mini
- GPT-4 Turbo
- GPT-4
- o1
- o1 Mini
- o3 Mini

### Google Gemini
- Gemini 2.5 Flash
- Gemini 2.5 Pro
- Gemini 2.0 Flash

## Variables

Use the `{{variableName}}` syntax in your prompts:

```
You are an expert assistant in {{topic}}.
Your audience is {{audience}}.
Always respond in {{language}}.
```

Variables will automatically appear in the testing panel.

## Deploy to GitHub Pages

1. Adjust the `base` in `vite.config.ts` to your repository name:

```typescript
export default defineConfig({
  base: '/your-repo/',
  plugins: [react()],
})
```

2. Build the project:

```bash
npm run build
```

3. Upload the `dist/` folder to GitHub Pages

## Storage

Data is stored in the browser's `localStorage`:
- `prompt-workbench-data`: Projects and prompts
- `prompt-workbench-settings`: Configuration and API keys

Use **Exportar** (Export) to backup your data.

## Technologies

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Anthropic API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs/)
- [Google Gemini API](https://ai.google.dev/docs)

## License

MIT
