# 実装タスクリスト

## 1. プロジェクト基盤のセットアップ
- [x] 1.1 (P)バックエンドのNode.js/Expressプロジェクトを初期化する
  - Expressサーバーの基本的なセットアップを行う。
  - 必要なnpmパッケージ（`express`, `cors`, `dotenv`）をインストールする。
  - `src`ディレクトリ構造を作成する。
  - _Requirements: 1, 2, 3, 4, 5_
- [x] 1.2 (P) フロントエンドのReact/Viteプロジェクトを初期化する
  - Viteを使用してReactプロジェクトの雛形を作成する。
  - 必要なnpmパッケージ（`axios`, `react-router-dom`）をインストールする。
  - `src`ディレクトリ構造（components, pages, services）を作成する。
  - _Requirements: 1, 2, 3, 5_
- [x] 1.3 Docker環境をセットアップする
  - `docker-compose.yml`を作成し、`postgres`サービスと`node`サービスを定義する。
  - `postgres`のデータ永続化のためのvolumeを設定する。
  - バックエンド用の`Dockerfile`を作成する。
  - _Requirements: 4_

## 2. データベースとデータモデルの実装
- [x] 2.1 データベーススキーマを定義する
  - `design.md`に基づき、`users`, `songs`, `user_lamps`, `lamp_history`テーブルを作成するためのSQLスクリプトを作成する。
  - _Requirements: 4.1_
- [x] 2.2 データベースマイグレーションツールを導入する
  - `node-pg-migrate`や`knex`などのマイグレーションツールをセットアップする。
  - 2.1で作成したスキーマ定義をマイグレーションファイルに変換する。
  - _Requirements: 4.2_
- [x] 2.3 データベース接続モジュールをバックエンドに作成する
  - `pg`パッケージを使用してPostgreSQLに接続するためのモジュールを実装する。
  - _Requirements: 4.1_

## 3. バックエンド(API)の実装
- [x] 3.1 ユーザー認証(AuthService)を実装する
  - Passport.jsと`passport-google-oauth20`をセットアップする。
  - Google Cloud ConsoleでOAuthクライアントIDとシークレットを取得し、`.env`ファイルに設定する。
  - `/auth/google`と`/auth/google/callback`のエンドポイントを実装する。
  - 認証成功時に`users`テーブルにユーザー情報を保存するロジックを実装する。
  - セッション管理のために`express-session`を設定する。
  - `/api/current_user`と`/api/logout`エンドポイントを実装する。
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
- [ ] 3.2 楽曲・クリアランプ管理(TierTrackerService)のAPIを実装する
  - 楽曲リストを取得する`/api/songs`エンドポイントを実装する。
  - ログインユーザーのランプ情報を取得する`/api/lamps`エンドポイントを実装する。
  - ランプ情報を更新する`/api/lamps` (PUT)エンドポイントを実装する。更新時に`lamp_history`にも記録する。
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_
- [ ] 3.3 統計機能(TierTrackerService)のAPIを実装する
  - ランプの更新履歴を取得する`/api/stats/history`エンドポイントを実装する。
  - レベルごとのクリア状況サマリーを取得するAPIを実装する。
  - _Requirements: 5.1, 5.2_

## 4. フロントエンド(UI)の実装
- [x] 4.1 (P) 基本的なルーティングとレイアウトを実装する
  - `react-router-dom`を使用して、ホームページ、ログインページ、ダッシュボードページのルーティングを設定する。
  - ヘッダーやフッターなどの共通レイアウトコンポーネントを作成する。
  - _Requirements: 1, 2_
- [x] 4.2 (P) ユーザー認証関連のUIを実装する
  - `LoginButton`コンポーネントを作成し、クリック時にバックエンドの認証エンドポイントにリダイレクトさせる。
  - 認証状態を管理するためのReactコンテキストまたは状態管理ライブラリ（Zustandなど）をセットアップする。
  - 認証済みユーザーの情報を表示し、ログアウトボタンを提供する。
  - _Requirements: 1.2, 1.4_
- [ ] 4.3 難易度表ページ(`MusicTable`)を実装する
  - レベル選択のUIを実装する。
  - 選択されたレベルの楽曲リストと、対応するユーザーのランプ情報をバックエンドから取得して表示する。
  - `LampSelector`コンポーネントを各楽曲に配置する。
  - 楽曲名でのフィルタリング機能を実装する。
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
- [ ] 4.4 ランプ更新機能(`LampSelector`)を実装する
  - ランプアイコンをクリックすると、ランプ状態の選択肢（ドロップダウンなど）を表示する。
  - 新しいランプ状態が選択されたら、バックエンドの更新APIを呼び出し、UIに即時反映させる。
  - _Requirements: 3.1, 3.2_
- [ ] 4.5 統計ページ(`StatsDashboard`, `ContributionCalendar`)を実装する
  - バックエンドからランプ更新履歴を取得し、`ContributionCalendar`コンポーネントで可視化する。
  - レベルごとのクリア状況サマリーをグラフで表示する。
  - _Requirements: 5.1, 5.2_

## 5. データインポート機能の実装
- [ ] 5.1 Textageスクレイピングスクリプト(DataImportService)を実装する
  - `axios`で`textage.cc`のHTMLを取得する。
  - `cheerio`でHTMLをパースし、楽曲データを抽出するロジックを実装する。
  - 抽出したデータを`songs`テーブルに保存するロジックを実装する（重複チェックを含む）。
  - `npm run scrape`のようなコマンドで実行できるように`package.json`にスクリプトを追加する。
  - _Requirements: 2.0_

## 6. 統合とテスト
- [ ] 6.1 APIとフロントエンドの結合テストを行う
  - 実際にブラウザから操作し、すべての機能が設計通りに動作することを確認する。
  - 認証、ランプ更新、統計表示などの主要なフローをテストする。
  - _Requirements: 1, 2, 3, 5_
- [ ] 6.2 単体テストと結合テストを作成する
  - バックエンドの各サービスクラスに対して単体テストを作成する。
  - APIエンドポイントに対する結合テストを作成する（Supertestなどを使用）。
  - - [ ]* フロントエンドの主要コンポーネントの基本的なレンダリングテストを作成する（React Testing Libraryを使用）。
  - _Requirements: 1, 2, 3, 4, 5_
