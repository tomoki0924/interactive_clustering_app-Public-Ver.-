from flask import Flask
from flask import request, make_response, jsonify
from flask_cors import CORS
import json
import os
from sklearn.metrics.cluster import normalized_mutual_info_score

from my_cop_kmeans_py.copkmeans import run_ckm

 

app = Flask(__name__, static_folder="./build/static", template_folder="./build")
CORS(app) #Cross Origin Resource Sharing

@app.route("/", methods=['GET'])
def index():
    return "cons_clust:)"

@app.route("/cons_clust", methods=['GET','POST'])
def cons_clust():
    """
    受け渡されるデータ形式は，{"index1":"", "index2":""}
    とする。
    """
    # 受けわたされた，mustlinkの対象をリストに代入
    #print(request.get_json())
    data = request.get_json()
    data_list=[int(data['index1']),int(data['index2'])]


    #  mustlink制約のオブジェクトをjsonファイルに書き込む
    if(os.path.exists('./log_storage/constrained.json')):
        with open("./log_storage/constrained.json", 'r')as c_file:
            try:
                constraineds = json.load(c_file)
            except Exception:
                constraineds =[]
    else:
        constraineds =[]
 
    constraineds.append(list(data_list))
    with open("./log_storage/constrained.json", 'w')as c_file:
        json.dump(constraineds, c_file)

    """
    with open("../frontend/public/truncated_svd_embeddings.json","r") as d_file:
        data = json.load(d_file)
    """
    
    clusters = run_ckm.run("./log_storage/truncated_svd_embeddings.json","./log_storage/constrained.json",3,10,300,1e-4)
    
    if not clusters:
        print('No solution was found!')
    else:
        # print(' '.join(str(c) for c in clusters))
        # clustlab_filenames = []
        # print(clusters)

        clustlab_filenames = os.listdir(path='./log_storage/clust_nums/')
        if clustlab_filenames == []:
            with open('./log_storage/clust_nums/clust_nums_0.json', 'w') as outfile:
                json.dump(clusters, outfile)
        else:
            file_names = './log_storage/clust_nums/clust_nums_'+str(len(clustlab_filenames))+'.json'
            with open(file_names , 'w') as outfile:
                json.dump(clusters, outfile)
        
        print("finish!")

    

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
    



    
    with open('../frontend/public/clust_nums.json','w') as res_file:
        json.dump(clusters, res_file)
    

    #res = wakati(text)
    #response = {'result': res}

    #with open("../frontend/app/public/parsed_text.json",'w')as f:
    #    json.dump(response, f, ensure_ascii=False)

    #print(response)
    #return make_response(jsonify(response))
    return make_response(jsonify("まわったよ！"))


@app.route("/reset_button", methods=['GET','POST'])
def reset_button():
    os.system('python reset.py')
    return make_response(jsonify("新しくしたよ！"))
    

if __name__ == "__main__":
    app.debug = True
    app.run(host='localhost', port=5000)
