import { useState } from 'react'

// 登録済みの銘柄をプルダウンから選び、価格だけを更新するフォーム
export function PriceUpdateForm({ investments, onSubmit, submitting }) {
  const [selectedId, setSelectedId] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const { error } = await onSubmit({ id: selectedId, price: Number(price) })

    if (error) {
      setError(error)
      return
    }

    setSelectedId('')
    setPrice('')
  }

  return (
    <form className="investment-form" onSubmit={handleSubmit}>
      <h2>価格更新</h2>

      <div className="form-row">
        <label htmlFor="priceUpdateSymbol">銘柄</label>
        <select
          id="priceUpdateSymbol"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          required
        >
          <option value="" disabled>
            選択してください
          </option>
          {investments.map((investment) => (
            <option key={investment.id} value={investment.id}>
              {investment.symbol}（現在 {Number(investment.price).toLocaleString()} {investment.currency}）
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="newPrice">新しい価格</label>
        <input
          id="newPrice"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={submitting || investments.length === 0}>
          更新する
        </button>
      </div>
    </form>
  )
}
