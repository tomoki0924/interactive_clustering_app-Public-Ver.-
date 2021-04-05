# interactive_clustering_app-Public-Ver.-
卒論のアプリ公開用


星野が卒業研究で作成したアプリです。
滅茶苦茶な状態ですが，誰かが興味を持ってくれることを期待し，公開しておきます。

# 動作環境

- python3.7
- pipenv
- npm


# 動かし方

```
git clone --recursive https://github.com/tomoki0924/interactive_clustering_app-Public-Ver.-.git


cd backend
pipenv install
pipenv run python setup.py
pipenv run python reset.py
pipenv run python server.py

# もう一つterminalのウィンドウを立ち上げる

cd ..
cd frontend
npm install
npm start

```

その後，[http://localhost:3000/](http://localhost:3000/)にアクセス。
