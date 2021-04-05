"""
前にあったデータを全てlogとして保存(pathの変更)。
ランダムな3字種それぞれ100文字取り出して，その情報を"../frontend/public/used_kana_labels.json"にdump。その後title_solidを作成。
umap, tsne, 軽量umapの2次元情報の作成。
並びにcop-kmeans用に50次元のTruncatedSVD(特異値分解)。
"""


import random
import numpy as np
from PIL import Image
import cv2
import json
import os
import math
from mnist import MNIST
import shutil

import umap
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.cluster import normalized_mutual_info_score
from sklearn.cluster import KMeans 

from my_cop_kmeans_py.copkmeans import run_ckm



## 1字種あたりのサンプル数
N = 50

"""
### log用のディレクトリ整理
n=0
while os.path.exists('./log_storage/'+str(n)+'_logdata'):
    n=n+1

os.mkdir('./log_storage/'+str(n)+'_logdata')

if os.path.exists('./log_storage/clust_nums'):
    shutil.move('./log_storage/clust_nums', './log_storage/'+str(n)+'_logdata/')
    if os.path.exists('./log_storage/constrained.json'):
        shutil.move('./log_storage/constrained.json', './log_storage/'+str(n)+'_logdata/')
    if os.path.exists('./log_storage/clust_ans.json'): 
        shutil.move('./log_storage/clust_ans.json', './log_storage/'+str(n)+'_logdata/')
    if os.path.exists('./log_storage/nmi_log.json'):
        shutil.move('./log_storage/nmi_log.json','./log_storage/'+str(n)+'_logdata/')


    if os.path.exists('./log_storage/used_kana_labels.json'):
        shutil.move('./log_storage/used_kana_labels.json','./log_storage/'+str(n)+'_logdata/') #選んだカナのラベルを記録
    if os.path.exists('./log_storage/truncated_svd_embeddings.json'):
        shutil.move('./log_storage/truncated_svd_embeddings.json','./log_storage/'+str(n)+'_logdata/')# 50次元Tsvd
    
    # 3次元のそれぞれの縮約した座標データ
    if os.path.exists('../frontend/public/kmnist-embeddings_1_2dim.json'):
        shutil.move('../frontend/public/kmnist-embeddings_1_2dim.json','./log_storage/'+str(n)+'_logdata/')
    if os.path.exists('../frontend/public/kmnist-embeddings_2_3dim.json'):
        shutil.move('../frontend/public/kmnist-embeddings_2_3dim.json','./log_storage/'+str(n)+'_logdata/')
    if os.path.exists('../frontend/public/kmnist-embeddings_1_3dim.json'):
        shutil.move('../frontend/public/kmnist-embeddings_1_3dim.json','./log_storage/'+str(n)+'_logdata/')

else:
    os.rmdir('./log_storage/'+str(n)+'_logdata')

"""

shutil.rmtree('./log_storage/clust_nums/')
os.mkdir('./log_storage/clust_nums/')


# 分析用データの作成
### ランダムな3文字からそれぞれ100字取得
# kana =[ random.sample(['お','き','す','つ','な','は','ま','や','れ','を'],3)]
kana = [random.sample(['0', '1', '2', '3','4', '5', '6', '7', '8', '9'],3)]
kana_index = [random.sample(range(len(os.listdir('../mnist_images/'+i))), k=N)for i in kana[0]]
###  扱う3文字とそれぞれのインデックスを取得。その後，結果をjsonに出力。
output_kana= kana+kana_index
with open('./log_storage/used_kana_labels.json', 'w') as outfile:
    json.dump(output_kana, outfile, ensure_ascii=False)
### ラベルの答えとなるデータを(と言っても100個づつ0,1,2を並べるだけ。)
ans_index = [0 for i in range(N)]+[1 for i in range(N)]+[2 for i in range(N)] 
with open('./log_storage/clust_ans.json', 'w') as outfile:
    json.dump(ans_index, outfile)


# loadするための画像(タイル風)の作成
### 画像のぞれぞれのデータを代入するlistの作成
temp_img_array_list = list()

a=1
for kana in output_kana[0]:
    for num in output_kana[a]:
        filepath ='../mnist_images/'+kana+'/'+ str(num)+'.png'
        temp_img = cv2.imread(filepath, cv2.IMREAD_GRAYSCALE)
        temp_img = temp_img.tolist()
        temp_img_array_list.append(temp_img)
    a = a + 1

temp_img_array_list = np.array(temp_img_array_list).astype(np.float32)

x_kmnist = temp_img_array_list.reshape([N*3, 28*28])
ss_width = 2048
image_width = 28
image_height = 28

columns = math.floor(ss_width/image_width)

all_rows = []
for i in range(len(x_kmnist)):
    if i % columns == 0:
        all_rows.append([])
    current = all_rows[len(all_rows) - 1]
    current.append(x_kmnist[i])

ranges = []
for i in range(math.ceil(len(all_rows) / columns)):
    start = i * columns
    end = (i + 1) * columns
    if i == math.ceil(len(all_rows) / columns) - 1:
        end = len(all_rows)
    ranged = range(start, end)
    ranges.append(ranged)

leftover = 2048 % columns
row_padding = []
for i in range(leftover):
    row_padding.append(0)
row_padding

chunk_padding = []
for i in range(2048 - columns * 28):
    chunk_padding.append([])
    current = chunk_padding[len(chunk_padding) - 1]
    for p in range(2048):
        current.append(0)
len(chunk_padding)

for range_counter in range(len(ranges)):
    full_combined = []
    for r in ranges[range_counter]:
        row_digits = all_rows[r]
        reshaped = []
        for i in range(len(row_digits)):
            digit = row_digits[i]
            digit.resize((28,28))
            reshaped.append(digit)
        combined = []
        for i in range(image_height):
            combined.append([])
            current = combined[len(combined) - 1]
            for j in range(len(row_digits)):
                current.extend(reshaped[j][i])
            padding_needed = ss_width - len(row_digits) * image_width
            for p in range(padding_needed):
                current.append(0)
        full_combined.extend(combined)
    row_padding_needed = ss_width - len(full_combined)
    wtf = row_padding_needed
    for rp in range(row_padding_needed):
        current = []
        for p in range(ss_width):
            current.append(0)
        full_combined.append(current)
    test = full_combined
    rgba_combined = []
    for row in full_combined:
        rgba_combined.append([])
        current = rgba_combined[len(rgba_combined) - 1]
        for item in row:
            current.append((item, item, item, 255))
    rgba_combined = np.asarray(rgba_combined)
    rgba_combined = rgba_combined.astype(np.uint8)
    im = Image.fromarray(np.asarray(rgba_combined), mode='RGBA')
    name = '../frontend/public/kmnist_tile_solid_' + str(range_counter) + '.png'
    im.save(name)

# x_kmnistを標準化しておく
sc = StandardScaler()
x_kmnist = sc.fit_transform(x_kmnist)


# umapの3次元データを取り出す
reducer = umap.UMAP(random_state=42, n_components=3)
embedding = reducer.fit_transform(x_kmnist)

# 1&2, 2&3, 1&3のついでそれぞれの縮約された成分をjsonにdump
with open('../frontend/public/kmnist-embeddings_1_2dim.json', 'w') as outfile:
    json.dump(embedding[:,[0,1]].tolist(), outfile)
with open('../frontend/public/kmnist-embeddings_2_3dim.json', 'w') as outfile:
    json.dump(embedding[:,[1,2]].tolist(), outfile)
with open('../frontend/public/kmnist-embeddings_1_3dim.json', 'w') as outfile:
    json.dump(embedding[:,[0,2]].tolist(), outfile)
# svdのやつをdump
svd = TruncatedSVD(n_components=50)
embedding = svd.fit_transform(x_kmnist)
with open('./log_storage/truncated_svd_embeddings.json', 'w') as outfile:
    json.dump(embedding.tolist(), outfile)


clusters =KMeans(n_clusters=3, init='random', n_init=10, max_iter=300,
                       tol=0.0001,precompute_distances='auto', verbose=0,
                       random_state=None, copy_x=True, n_jobs=1).fit_predict(embedding)

#  NMIの値をjsonファイルに書き込む
if(os.path.exists('./log_storage/nmi_log.json')):
    with open("./log_storage/nmi_log.json", 'r')as n_file:
        try:
            nmis = json.load(n_file)
        except Exception:
            nmis =[]
else:
    nmis =[]

with open("./log_storage/clust_ans.json", 'r') as ans_file:
    anss = json.load(ans_file)

nmi_res = normalized_mutual_info_score(anss, clusters)

nmis.append(nmi_res)
with open("./log_storage/nmi_log.json", 'w')as n_file:
    json.dump(nmis, n_file)
    
# クラスタを書き込む
with open('./log_storage/clust_nums/clust_nums_0.json', 'w') as outfile:
    json.dump(clusters.tolist(), outfile)
with open('../frontend/public/clust_nums.json','w') as res_file:
    json.dump(clusters.tolist(), res_file)