export default function ApiKeysTab() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">API Keys</h2>
      <p className="text-flowstarter-elements-textSecondary">
        API keys are managed through environment variables. Set OPEN_ROUTER_API_KEY in your .env.local file.
      </p>
    </div>
  );
}
