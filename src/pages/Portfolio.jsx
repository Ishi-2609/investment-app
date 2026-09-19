import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { InvestmentForm } from '../components/InvestmentForm'
import { PriceUpdateForm } from '../components/PriceUpdateForm'

// ログイン後に表示する投資ポートフォリオ一覧画面
// investmentsテーブルに対してSupabase経由でCRUD操作を行う
export function Portfolio() {
  const { user, signOut } = useAuth()
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(null)
  // 編集中の銘柄。nullの場合は新規登録モード
  const [editingInvestment, setEditingInvestment] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [priceUpdating, setPriceUpdating] = useState(false)

  // 自分が登録した銘柄一覧を取得する（RLSにより自動的に自分の行だけが返る）
  const fetchInvestments = useCallback(async () => {
    setLoading(true)
    setListError(null)

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .order('registered_on', { ascending: false })

    if (error) {
      setListError('銘柄一覧の取得に失敗しました。')
    } else {
      setInvestments(data)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchInvestments()
  }, [fetchInvestments])

  // 新規登録・編集フォームの送信処理
  const handleSubmit = async ({ symbol, price, currency, region, registeredOn }) => {
    setSubmitting(true)

    const { error } = editingInvestment
      ? await supabase
          .from('investments')
          .update({ symbol, price, currency, region, registered_on: registeredOn })
          .eq('id', editingInvestment.id)
      : await supabase
          .from('investments')
          .insert({ symbol, price, currency, region, registered_on: registeredOn, user_id: user.id })

    setSubmitting(false)

    if (error) {
      return { error: editingInvestment ? '銘柄の更新に失敗しました。' : '銘柄の登録に失敗しました。' }
    }

    setEditingInvestment(null)
    await fetchInvestments()
    return {}
  }

  // 登録済みの銘柄をプルダウンで選び、価格だけを更新する処理
  const handlePriceUpdate = async ({ id, price }) => {
    setPriceUpdating(true)

    const { error } = await supabase.from('investments').update({ price }).eq('id', id)

    setPriceUpdating(false)

    if (error) {
      return { error: '価格の更新に失敗しました。' }
    }

    await fetchInvestments()
    return {}
  }

  // 銘柄の削除処理
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

      <PriceUpdateForm
        investments={investments}
        onSubmit={handlePriceUpdate}
        submitting={priceUpdating}
      />

      {listError && <p className="error-message">{listError}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : investments.length === 0 ? (
        <p>登録されている銘柄はありません。</p>
      ) : (
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
                <td>{Number(investment.price).toLocaleString()}</td>
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
      )}
    </div>
  )
}
