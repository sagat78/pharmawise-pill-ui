import { useState, useRef } from 'react'
import './App.css'

const API_URL = 'http://localhost:3001/api/identify'
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

function formatDosage(raw) {
  if (!raw) return 'Unknown'
  return raw
    .replace(/^[A-Z\s]+\s+/i, '')
    .replace(/\/\d+$/, '')
    .trim()
}

function ConfidenceBadge({ level }) {
  const map = { high: '#16a34a', medium: '#d97706', low: '#dc2626' }
  const color = map[level?.toLowerCase()] ?? '#6b7280'
  return (
    <span className="confidence-badge" style={{ '--dot': color }}>
      <span className="confidence-dot" />
      {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Unknown'} confidence
    </span>
  )
}

const CameraIcon = () => (
  <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
)

function UploadZone({ label, optional, preview, onFile }) {
  const inputRef = useRef(null)

  function handleFile(f) {
    if (!f) return
    if (f.size > MAX_FILE_BYTES) {
      alert('Image too large. Please upload an image under 10MB.')
      return
    }
    onFile(f, URL.createObjectURL(f))
  }

  return (
    <div className="upload-zone">
      <div className="upload-zone-label">
        {label}
        {optional && <span className="optional-tag">Optional</span>}
      </div>

      <div
        className={`upload-area${preview ? ' has-preview' : ''}`}
        onClick={() => inputRef.current.click()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current.click()}
        aria-label={`Upload ${label}`}
      >
        {preview ? (
          <img src={preview} className="preview-img" alt={`${label} preview`} />
        ) : (
          <div className="upload-placeholder">
            <CameraIcon />
            <p className="upload-hint">Drop or <span className="upload-link">browse</span></p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden-input"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}

export default function App() {
  const [frontFile, setFrontFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function handleFront(f, url) {
    setFrontFile(f); setFrontPreview(url)
    setResult(null); setError(null)
  }

  function handleBack(f, url) {
    setBackFile(f); setBackPreview(url)
    setResult(null); setError(null)
  }

  function reset() {
    setFrontFile(null); setFrontPreview(null)
    setBackFile(null); setBackPreview(null)
    setResult(null); setError(null)
  }

  async function identify() {
    if (!frontFile) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const form = new FormData()
      form.append('image_front', frontFile)
      if (backFile) form.append('image_back', backFile)

      const res = await fetch(API_URL, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'API error')
      setResult(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        {/* Header */}
        <div className="card-header">
          <span className="logo">PharmaWise</span>
          <h1 className="title">Pill Identifier</h1>
          <p className="subtitle">Take or upload a photo of your medication</p>
        </div>

        {/* Upload zones */}
        <div className="upload-row">
          <UploadZone
            label="Front of pill"
            optional={false}
            preview={frontPreview}
            onFile={handleFront}
          />
          <UploadZone
            label="Back of pill"
            optional={true}
            preview={backPreview}
            onFile={handleBack}
          />
        </div>

        <button
          className="identify-btn"
          onClick={identify}
          disabled={!frontFile || loading}
        >
          {loading ? 'Analyzing...' : 'Identify Pill'}
        </button>

        {/* Loading */}
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p className="loading-text">Analyzing your medication...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <>
            <div className="error-state">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <p>We couldn't identify this pill. Please try a clearer photo.</p>
            </div>
            <button className="try-again-btn" onClick={reset}>Try Again</button>
          </>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {result.warning && (
              <div className="warning-banner">
                <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <p>{result.warning}</p>
              </div>
            )}

            <div className="results-card">
              <div className="result-drug-name">{result.drug_name}</div>
              <div className="result-dosage">{formatDosage(result.dosage)}</div>

              <div className="result-badges">
                {result.imprint && (
                  <div className="badge">
                    <span className="badge-label">Imprint</span>
                    <span className="badge-value">{result.imprint}</span>
                  </div>
                )}
                {result.shape && (
                  <div className="badge">
                    <span className="badge-label">Shape</span>
                    <span className="badge-value">{result.shape}</span>
                  </div>
                )}
                {result.color && (
                  <div className="badge">
                    <span className="badge-label">Color</span>
                    <span className="badge-value">{result.color}</span>
                  </div>
                )}
              </div>

              <ConfidenceBadge level={result.confidence} />

              <p className="disclaimer">{result.disclaimer}</p>
            </div>

            <button className="try-again-btn" onClick={reset}>Try Again</button>
          </>
        )}
      </div>
    </div>
  )
}
