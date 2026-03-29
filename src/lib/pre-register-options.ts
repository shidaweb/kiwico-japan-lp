/** Allowed values for pre-registration form (must match UI copy). */

export const INTEREST_CHOICES = [
  '工作やものづくりが楽しそう',
  '実験や科学に触れさせたい',
  '手を動かす学びに興味がある',
  '英語圏で人気の教材に興味がある',
  '自宅でできる良質な学びを探している',
  '子どもの好奇心を伸ばしたい',
  '親の準備が少ない教材を探している',
  'ギフトとして興味がある',
  'その他（自由記述）',
] as const;

export const THEME_CHOICES = [
  '工作・クラフト',
  '科学実験',
  'エンジニアリング',
  'アート・デザイン',
  '生き物・自然',
  '遊びながら学ぶ教材全般',
  'まだ分からない',
  'その他（自由記述）',
] as const;

export const PRICE_CHOICES = [
  '2,000円未満',
  '2,000〜3,999円',
  '4,000〜5,999円',
  '6,000〜7,999円',
  '8,000円以上でも内容次第で検討したい',
  'まだ分からない',
] as const;

export const NOTIFICATION_CHOICES = [
  'サービス開始のお知らせ',
  '先行申込のご案内',
  'モニター募集のご案内',
  '日本向け商品情報のお知らせ',
  'メール案内を希望する',
] as const;

export const USAGE_CHOICES = [
  '定期購入に興味がある',
  'まずは単品で試してみたい',
  'ギフト利用に興味がある',
  '内容を見てから決めたい',
  'まだ分からない',
] as const;

export const INTEREST_OTHER = 'その他（自由記述）';
export const THEME_OTHER = 'その他（自由記述）';
