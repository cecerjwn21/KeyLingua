const diagnosticVoiceNames = new Set([
  'Microsoft Nanami Online (Natural) - Japanese (Japan)',
  'Microsoft Keita Online (Natural) - Japanese (Japan)',
])

export default function SpeechVoiceDiagnostics({ voices }: { voices: SpeechSynthesisVoice[] }) {
  return (
    <div data-testid="speech-voice-diagnostics" className="mt-4 overflow-x-auto rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-600">
      <p className="mb-2 font-semibold text-slate-900 dark:text-slate-100">目前瀏覽器提供的 voices</p>
      {voices.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">目前沒有可用語音。</p>
      ) : (
        <table className="w-full min-w-[30rem] text-left">
          <thead className="text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-2 py-1 font-medium">name</th>
              <th className="px-2 py-1 font-medium">voiceURI</th>
              <th className="px-2 py-1 font-medium">lang</th>
              <th className="px-2 py-1 font-medium">localService</th>
              <th className="px-2 py-1 font-medium">default</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-slate-200">
            {voices.map((voice) => (
              <tr key={voice.voiceURI} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-2 py-1 align-top">
                  {voice.name}
                  {diagnosticVoiceNames.has(voice.name) && (
                    <span className="ml-1 text-indigo-600 dark:text-indigo-300">（目標語音）</span>
                  )}
                </td>
                <td className="px-2 py-1 align-top">{voice.voiceURI}</td>
                <td className="px-2 py-1 align-top">{voice.lang}</td>
                <td className="px-2 py-1 align-top">{String(voice.localService)}</td>
                <td className="px-2 py-1 align-top">{String(voice.default)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
