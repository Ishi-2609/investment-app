import { useState } from 'react'

// 今日の日付を "YYYY-MM-DD" 形式で取得する
function todayString() {
  return new Date().toISOString().slice(0, 10)
}

// 銘柄の新規登録・編集で共用するフォーム
// initialValuesを渡すと編集モード、渡さないと新規登録モードになる
export function InvestmentForm({ initialValues, onSubmit, onCancel, submitting }) {
  const isEditing = Boolean(initialValues)

  const [symbol, setSymbol] = useState(initialValues?.symbol ?? '')
  const [price, setPrice] = useState(initialValues?.price ?? '')
  const [registeredOn, setRegisteredOn] = useState(
    initialValues?.registered_on ?? todayString(),
  )
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const { error } = await onSubmit({
      symbol,
      price: Number(price),
      registeredOn,
    })

    if (error) {
      setError(error)
      return
    }

    if (!isEditing) {
      // 新規登録が成功したらフォームを空にする
      setSymbol('')
      setPrice('')
      setRegisteredOn(todayString())
    }
  }

  return (
    <form className="investment-form" onSubmit={handleSubmit}>
      <h2>{isEditing ? '銘柄を編集' : '新規銘柄登録'}</h2>

      <div className="form-row">
        <label htmlFor="symbol">銘柄</label>
        <input
          id="symbol"
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="price">価格（円）</label>
        <input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="registeredOn">登録日</label>
        <input
          id="registeredOn"
          type="date"
          value={registeredOn}
          onChange={(e) => setRegisteredOn(e.target.value)}
          required
        />
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {isEditing ? '更新する' : '登録する'}
        </button>
        {isEditing && (
          <button type="button" onClick={onCancel} disabled={submitting}>
            キャンセル
          </button>
        )}
      </div>
    </form>
  )
}
