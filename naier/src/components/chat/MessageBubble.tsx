import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const time = new Date(message.created_at * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`message-slide-in flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${message.isMine ? 'rounded-tr-sm bg-bg-bubble-mine text-white' : 'rounded-tl-sm bg-bg-bubble-peer text-text-primary shadow-sm'}`}
      >
        {message.isImage ? (
          <img
            src={message.decrypted}
            alt="image"
            className="max-w-xs cursor-pointer rounded-xl"
            onClick={() => window.open(message.decrypted, '_blank')}
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : message.failed ? (
          <p className="italic text-text-secondary">[Decryption failed]</p>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.decrypted}</p>
        )}

        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${message.isMine ? 'text-white/70' : 'text-text-secondary'}`}
        >
          <span>{time}</span>
        </div>
      </div>
    </div>
  )
}
