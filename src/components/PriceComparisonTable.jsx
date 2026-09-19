// 各銘柄の最新価格と前回価格を比較する表
// investmentsの各要素は、pricesに日付の新しい順で並んだ価格履歴を持つ想定
export function PriceComparisonTable({ investments }) {
  return (
    <table className="portfolio-table comparison-table">
      <thead>
        <tr>
          <th>銘柄</th>
          <th>通貨</th>
          <th>最新価格</th>
          <th>最新日付</th>
          <th>前回価格</th>
          <th>前回日付</th>
          <th>差分</th>
          <th>騰落率</th>
        </tr>
      </thead>
      <tbody>
        {investments.map((investment) => {
          const [latest, previous] = investment.prices
          const diff = latest && previous ? latest.price - previous.price : null
          const rate = diff !== null && previous.price !== 0 ? (diff / previous.price) * 100 : null
          const diffClass = diff > 0 ? 'diff-up' : diff < 0 ? 'diff-down' : ''

          return (
            <tr key={investment.id}>
              <td>{investment.symbol}</td>
              <td>{investment.currency}</td>
              <td>{latest ? Number(latest.price).toLocaleString() : '-'}</td>
              <td>{latest ? latest.priced_on : '-'}</td>
              <td>{previous ? Number(previous.price).toLocaleString() : '-'}</td>
              <td>{previous ? previous.priced_on : '-'}</td>
              <td className={diffClass}>
                {diff === null ? '-' : `${diff > 0 ? '+' : ''}${diff.toLocaleString()}`}
              </td>
              <td className={diffClass}>{rate === null ? '-' : `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
