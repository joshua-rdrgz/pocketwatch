import { CounterDemo } from '../components/counter-demo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pocketwatch WebSocket Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This demonstrates real-time communication between the web app and
            Chrome extension using WebSockets. Click the button below or in the
            extension to increment the counter!
          </p>
        </div>

        <CounterDemo />

        <div className="mt-12 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              How to test:
            </h3>
            <ul className="text-blue-800 space-y-1">
              <li>• Install the Chrome extension</li>
              <li>• Open the side panel and click the increment button</li>
              <li>• Watch the counter update in real-time on this page</li>
              <li>
                • Click the button above and see it update in the extension
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
