"""
kmnistを1枚づつ".png"で出力。(最初に1回だけ実行する。)
kmnist_datasetの7万字の正解ラベルの".json"を
'../frontend/public/kmnist_labels.json'に作成します。
"""
#from sklearn.datasets import fetch_mldata
# from mnist import MNIST
import PIL
import numpy as np
from PIL import Image
import math
import os
import json
from sklearn.datasets import fetch_openml



#mnist = MNIST('../kmnist_dataset')
#x_train, y_train = mnist.load_training() #60000 samples
#x_test, y_test = mnist.load_testing()    #10000 samples

#x_train = np.asarray(x_train).astype(np.float32)
#y_train = np.asarray(y_train).astype(np.int32)
#x_test = np.asarray(x_test).astype(np.float32)
#y_test = np.asarray(y_test).astype(np.int32)

#x_kmnist = np.append(x_train, x_test, axis=0)
#y_kmnist = np.append(y_train, y_test, axis=0)

# dirnames = ['お', 'き', 'す', 'つ',
#            'な', 'は', 'ま', 'や', 'れ', 'を']

#x_kmnist = np.asarray(mnist.data).astype(np.float32)
#y_kmnist = np.asarray(mnist.target).astype(np.int32)

x_kmnist,y_kmnist = fetch_openml('mnist_784', return_X_y=True)

x_kmnist = np.asarray(x_kmnist).astype(np.float32)
y_kmnist = np.asarray(y_kmnist).astype(np.int32)

dirnames = ['0', '1', '2', '3','4', '5', '6', '7', '8', '9']
def save_img(filename, data):
    
    img = Image.new("L", (28, 28))
    pix = img.load()
    for i in range(28):
        for j in range(28):
            pix[i, j] = int(data[i+j*28])
    # img2 = img.resize((28*5, 28*5))
    img.save(filename)

def dump(images, labels, dhead):
    for i in range(10):
        dname = "{}/{}".format(dhead, dirnames[i])
        if os.path.isdir(dname) is False:
            os.makedirs(dname)
    count = [0]*10
    for i in range(len(images)):
        index = labels[i]
        filename = "{}/{}/{}.png".format(dhead, dirnames[index], count[index])
        save_img(filename, images[i])
        count[index] += 1
        print(filename)

dump(x_kmnist, y_kmnist, "../mnist_images")


labels = y_kmnist.tolist()
labels = [str(l) for l in labels]
kmnist_lab = labels
#kmnist_lab=[l.replace("0","お").replace("1","き").replace("2","す").replace("3","つ").replace("4","な").replace("5","は").\
#        replace("6","ま").replace("7","や").replace("8","れ").replace("9","を") for l in labels]

with open('../frontend/public/kmnist_labels.json', 'w') as outfile:
    json.dump(kmnist_lab, outfile, ensure_ascii=False)