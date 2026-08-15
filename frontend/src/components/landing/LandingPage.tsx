import { CredentialsForm } from './CredentialsForm';

export function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            RecallAI
          </h1>
          <p className="text-lg text-slate-300">
            Your AI. With Memory. And the Web.
          </p>
          <p className="text-sm text-slate-400">
            A memory-enabled, web-aware AI assistant powered by Amazon Bedrock.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl">
          <CredentialsForm />
        </div>

        <p className="text-xs text-slate-500 text-center px-4">
          Your AWS credentials are used only to access Amazon Bedrock and are not
          stored permanently. They remain in your browser session and are cleared
          when you close the tab.
        </p>
      </div>
    </div>
  );
}
