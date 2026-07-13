export default function Modal({ show, onClose, title, children, wide = false }) {
  if (!show) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={wide ? { maxWidth: 700, padding: 0 } : {}}>
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  )
}
