import { useState } from 'react'

// 今日の日付を "YYYY-MM-DD" 形式で取得する
function todayString() {
  return new Date().toISOString().slice(0, 10)
}

// 登録済みの銘柄をプルダウンから選び、指定した日付の価格を新しい履歴として追加するフォーム
// 既存の価格は上書きせず、investment_pricesに別レコードとして残す
export function PriceUpdateForm({ investments, onSubmit, submitting }) {
  const [selectedId, setSelectedId] = useState('')
  const [price, setPrice] = useState('')
  const [pricedOn, setPricedOn] = useState(todayString())
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const { error } = await onSubmit({
      investmentId: selectedId,
      price: Number(price),
      pricedOn,
    })

    if (error) {
      setError(error)
      return
    }

    setPrice('')
    setPricedOn(todayString())
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
          {investments.map((investment) => {
            const latest = investment.prices?.[0]
            return (
              <option key={investment.id} value={investment.id}>
                {investment.symbol}
                {latest
                  ? `（現在 ${Number(latest.price).toLocaleString()} ${investment.currency}）`
                  : ''}
              </option>
            )
          })}
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="newPrice">価格</label>
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

      <div className="form-row">
        <label htmlFor="pricedOn">日付</label>
        <input
          id="pricedOn"
          type="date"
          value={pricedOn}
          onChange={(e) => setPricedOn(e.target.value)}
          required
        />
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={submitting || investments.length === 0}>
          追加する
        </button>
      </div>
    </form>
  )
}
