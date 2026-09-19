import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { InvestmentForm } from '../components/InvestmentForm'
import { PriceUpdateForm } from '../components/PriceUpdateForm'
import { PriceComparisonTable } from '../components/PriceComparisonTable'

// 価格履歴を日付が新しい順に並べ替える（同じ日付の場合は登録が新しい方を優先する）
function sortPricesDesc(prices) {
  return [...(prices ?? [])].sort((a, b) => {
    if (a.priced_on !== b.priced_on) return a.priced_on < b.priced_on ? 1 : -1
    return new Date(b.created_at) - new Date(a.created_at)
  })
}

// ログイン後に表示する投資ポートフォリオ一覧画面
// investments（銘柄）とinvestment_prices（価格履歴）をSupabase経由でCRUD操作する
export function Portfolio() {
  const { user, signOut } = useAuth()
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(null)
  // 編集中の銘柄。nullの場合は新規登録モード
  const [editingInvestment, setEditingInvestment] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [priceSubmitting, setPriceSubmitting] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

  // 自分が登録した銘柄と、その価格履歴を取得する（RLSにより自動的に自分の行だけが返る）
  const fetchInvestments = useCallback(async () => {
    setLoading(true)
    setListError(null)

    const { data, error } = await supabase
      .from('investments')
      .select('*, investment_prices(id, price, priced_on, created_at)')
      .order('registered_on', { ascending: false })

    if (error) {
      setListError('銘柄一覧の取得に失敗しました。')
    } else {
      setInvestments(
        data.map((investment) => ({
          ...investment,
          prices: sortPricesDesc(investment.investment_prices),
        })),
      )
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchInvestments()
  }, [fetchInvestments])

  // 新規登録・編集フォームの送信処理
  const handleSubmit = async (values) => {
    setSubmitting(true)

    if (editingInvestment) {
      // 編集では銘柄情報のみ更新する（価格は価格更新フォームで履歴として追加する）
      const { error } = await supabase
        .from('investments')
        .update({
          symbol: values.symbol,
          currency: values.currency,
          region: values.region,
          registered_on: values.registeredOn,
        })
        .eq('id', editingInvestment.id)

      setSubmitting(false)

      if (error) {
        return { error: '銘柄の更新に失敗しました。' }
      }
    } else {
      // 新規登録では銘柄情報を作成し、初回価格を価格履歴として追加する
      const { data: newInvestment, error: insertError } = await supabase
        .from('investments')
        .insert({
          symbol: values.symbol,
          currency: values.currency,
          region: values.region,
          registered_on: values.registeredOn,
          user_id: user.id,
        })
        .select()
        .single()

      if (insertError) {
        setSubmitting(false)
        return { error: '銘柄の登録に失敗しました。' }
      }

      const { error: priceError } = await supabase
        .from('investment_prices')
        .insert({ investment_id: newInvestment.id, price: values.price, priced_on: values.registeredOn })

      setSubmitting(false)

      if (priceError) {
        return { error: '価格の登録に失敗しました。' }
      }
    }

    setEditingInvestment(null)
    await fetchInvestments()
    return {}
  }

  // 指定した日付の価格を新しい履歴として追加する（既存の価格は上書きしない）
  const handlePriceUpdate = async ({ investmentId, price, pricedOn }) => {
    setPriceSubmitting(true)

    const { error } = await supabase
      .from('investment_prices')
      .insert({ investment_id: investmentId, price, priced_on: pricedOn })

    setPriceSubmitting(false)

    if (error) {
      return { error: '価格の登録に失敗しました。' }
    }

    await fetchInvestments()
    return {}
  }

  // 銘柄の削除処理（価格履歴も連動して削除される）
  const handleDelete = async (investment) => {
    if (!window.confirm(`「${investment.symbol}」を削除しますか？`)) return

    const { error } = await supabase.from('investments').delete().eq('id', investment.id)

    if (error) {
      setListError('銘柄の削除に失敗しました。')
      return
    }

    if (editingInvestment?.id === investment.id) {
      setEditingInvestment(null)
    }

    await fetchInvestments()
  }

  return (
    <div className="portfolio-container">
      <header className="portfolio-header">
        <div>
          <h1>投資ポートフォリオ一覧</h1>
          <p className="user-email">{user?.email}</p>
        </div>
        <button type="button" onClick={signOut}>
          ログアウト
        </button>
      </header>

      <InvestmentForm
        key={editingInvestment?.id ?? 'new'}
        initialValues={editingInvestment}
        onSubmit={handleSubmit}
        onCancel={() => setEditingInvestment(null)}
        submitting={submitting}
      />

      <PriceUpdateForm investments={investments} onSubmit={handlePriceUpdate} submitting={priceSubmitting} />

      {listError && <p className="error-message">{listError}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : investments.length === 0 ? (
        <p>登録されている銘柄はありません。</p>
      ) : (
        <>
          <div className="section-actions">
            <button type="button" onClick={() => setShowComparison((prev) => !prev)}>
              {showComparison ? '比較を閉じる' : '比較'}
            </button>
          </div>

          {showComparison && <PriceComparisonTable investments={investments} />}

          <table className="portfolio-table">
            <thead>
              <tr>
                <th>銘柄</th>
                <th>価格</th>
                <th>通貨</th>
                <th>投資先</th>
                <th>登録日</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((investment) => (
                <tr key={investment.id}>
                  <td>{investment.symbol}</td>
                  <td>{investment.prices[0] ? Number(investment.prices[0].price).toLocaleString() : '-'}</td>
                  <td>{investment.currency}</td>
                  <td>{investment.region}</td>
                  <td>{investment.registered_on}</td>
                  <td className="table-actions">
                    <button type="button" onClick={() => setEditingInvestment(investment)}>
                      編集
                    </button>
                    <button type="button" onClick={() => handleDelete(investment)}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
