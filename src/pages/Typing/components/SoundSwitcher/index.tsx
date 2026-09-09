import { keySoundResources } from '@/resources/soundResource'
import ProductIcon from '@/components/ProductIcon'
import useKeySounds from '@/hooks/useKeySounds'
import { hintSoundsConfigAtom, keySoundsConfigAtom } from '@/store'
import { Popover, Switch, Transition } from '@headlessui/react'
import { useAtom } from 'jotai'
import type { ChangeEventHandler } from 'react'
import { Fragment, useCallback } from 'react'
import { Volume2, VolumeX } from 'lucide'

export default function SoundSwitcher({ ariaLabel = '音效設定' }: { ariaLabel?: string }) {
  const [keySoundsConfig, setKeySoundsConfig] = useAtom(keySoundsConfigAtom)
  const [hintSoundsConfig, setHintSoundsConfig] = useAtom(hintSoundsConfigAtom)
  const [playKeySound] = useKeySounds()

  const onChangeKeySound = useCallback(
    (checked: boolean) => {
      setKeySoundsConfig((old) => ({ ...old, isOpen: checked }))
    },
    [setKeySoundsConfig],
  )

  const onChangeHintSound = useCallback(
    (checked: boolean) => {
      setHintSoundsConfig((old) => ({ ...old, isOpen: checked }))
    },
    [setHintSoundsConfig],
  )

  const onChangeKeySoundResource: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (event) => {
      const resource = keySoundResources.find((item) => item.key === event.target.value)
      if (!resource) return
      setKeySoundsConfig((old) => ({ ...old, resource }))
    },
    [setKeySoundsConfig],
  )

  const onChangeKeySoundVolume: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      setKeySoundsConfig((old) => ({ ...old, volume: Number(event.target.value) / 100 }))
    },
    [setKeySoundsConfig],
  )

  const onChangeHintSoundVolume: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      setHintSoundsConfig((old) => ({ ...old, volume: Number(event.target.value) / 100 }))
    },
    [setHintSoundsConfig],
  )

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={`app-icon-button ${open || keySoundsConfig.isOpen || hintSoundsConfig.isOpen ? 'app-icon-button-active' : ''}`}
            aria-label={ariaLabel}
            title={ariaLabel}
          >
            <ProductIcon icon={keySoundsConfig.isOpen || hintSoundsConfig.isOpen ? Volume2 : VolumeX} size={19} />
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-out duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="fixed left-4 right-4 top-20 z-[80] mt-2 flex max-h-[calc(100vh-6rem)] overflow-y-auto sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-72">
              <div className="box-border flex w-full select-none flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <div className="flex w-full  flex-col  items-start gap-2 py-0">
                  <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">開關按鍵音</span>
                  <div className="flex w-full flex-row items-center justify-between">
                    <Switch checked={keySoundsConfig.isOpen} onChange={onChangeKeySound} className="switch-root">
                      <span aria-hidden="true" className="switch-thumb" />
                    </Switch>
                    <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-300">{`音效已${
                      keySoundsConfig.isOpen ? '開啟' : '關閉'
                    }`}</span>
                  </div>
                </div>
                <label
                  className="flex w-full flex-col gap-2 text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60"
                  htmlFor="key-sound-resource"
                >
                  按鍵音色
                  <select
                    id="key-sound-resource"
                    aria-label="按鍵音色"
                    value={keySoundsConfig.resource.key}
                    onChange={onChangeKeySoundResource}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {keySoundResources.map((resource) => (
                      <option key={resource.key} value={resource.key}>
                        {resource.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex w-full flex-col gap-2 text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">
                  按鍵音音量
                  <div className="flex items-center gap-3">
                    <input
                      aria-label="按鍵音音量"
                      className="h-1.5 min-w-0 flex-1 cursor-pointer accent-indigo-500"
                      type="range"
                      min="0"
                      max="150"
                      step="1"
                      value={Math.round(keySoundsConfig.volume * 100)}
                      onChange={onChangeKeySoundVolume}
                    />
                    <span className="w-9 text-right text-xs text-gray-600 dark:text-gray-300">{Math.round(keySoundsConfig.volume * 100)}%</span>
                  </div>
                </label>
                <button
                  type="button"
                  aria-label="測試打字音效"
                  className="app-button app-button-secondary w-full"
                  onClick={() => playKeySound()}
                >
                  <ProductIcon icon={Volume2} size={17} />
                  測試打字音效
                </button>
                <div className="flex w-full flex-col items-start  gap-2 py-0">
                  <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">開關效果音</span>
                  <div className="flex w-full flex-row items-center justify-between">
                    <Switch checked={hintSoundsConfig.isOpen} onChange={onChangeHintSound} className="switch-root">
                      <span aria-hidden="true" className="switch-thumb" />
                    </Switch>
                    <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-300">{`音效已${
                      hintSoundsConfig.isOpen ? '開啟' : '關閉'
                    }`}</span>
                  </div>
                </div>
                <label className="flex w-full flex-col gap-2 text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">
                  效果音音量
                  <div className="flex items-center gap-3">
                    <input
                      aria-label="效果音音量"
                      className="h-1.5 min-w-0 flex-1 cursor-pointer accent-indigo-500"
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(hintSoundsConfig.volume * 100)}
                      onChange={onChangeHintSoundVolume}
                    />
                    <span className="w-9 text-right text-xs text-gray-600 dark:text-gray-300">{Math.round(hintSoundsConfig.volume * 100)}%</span>
                  </div>
                </label>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}
