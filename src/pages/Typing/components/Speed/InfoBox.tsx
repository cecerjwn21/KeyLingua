import React from 'react'

const InfoBox: React.FC<InfoBoxProps> = ({ info, description }) => {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
      <span className="w-full whitespace-nowrap border-b pb-2 text-center text-base font-bold text-slate-700 transition-colors duration-300 dark:text-slate-200 sm:w-4/5 sm:text-xl">
        {info}
      </span>
      <span className="whitespace-nowrap pt-2 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400">{description}</span>
    </div>
  )
}

export default React.memo(InfoBox)

export type InfoBoxProps = {
  info: string
  description: string
}
