import React, { Component } from 'react'
import Layout from './Layout'
import * as _ from 'lodash'
import * as d3 from 'd3'

let  algorithm_options = [
    /*'umap1_2', 'umap2_3', 'umap1_3',*/

  '第１成分×第２成分',
  '第２成分×第３成分',
  '第１成分×第３成分',

]
let algorithm_embedding_keys = ['mnist_embeddings', 'dim2_3', 'dim1_3']


class Data extends Component {
  constructor(props) {
    super(props)
    this.state = {
      mnist_embeddings: null,
      mnist_labels: null,
    }
  }

  scaleEmbeddings(embeddings) {
    let xs = embeddings.map(e => Math.abs(e[0]))
    let ys = embeddings.map(e => Math.abs(e[1]))
    let max_x = _.max(xs)
    let max_y = _.max(ys)
    let max = Math.max(max_x, max_y)
    let scale = d3
      .scaleLinear()
      .domain([-max, max])
      .range([-20, 20])
    let scaled_embeddings = embeddings.map(e => [scale(e[0]), scale(e[1])])
    return scaled_embeddings
  }

  componentDidMount() {
    fetch(`${process.env.PUBLIC_URL}/kmnist-embeddings_1_2dim.json`)
      .then(response => response.json())
      .then(mnist_embeddings => {
        let scaled_embeddings = this.scaleEmbeddings(mnist_embeddings)
        this.setState({
          mnist_embeddings: scaled_embeddings,
        })
      })
    fetch(`${process.env.PUBLIC_URL}/kmnist-embeddings_2_3dim.json`)
      .then(response => response.json())
      .then(mnist_embeddings => {
        let scaled_embeddings = this.scaleEmbeddings(mnist_embeddings)
        //console.log('got em')
        this.setState({
          dim2_3: scaled_embeddings,
        })
      })
    fetch(`${process.env.PUBLIC_URL}/kmnist-embeddings_1_3dim.json`)
      .then(response => response.json())
      .then(mnist_embeddings => {
        let scaled_embeddings = this.scaleEmbeddings(mnist_embeddings)
        this.setState({
          dim1_3: scaled_embeddings,
        })
      })
    fetch(`${process.env.PUBLIC_URL}/clust_nums.json`)
      .then(response => response.json())
      .then(mnist_labels =>
        this.setState({
          mnist_labels: mnist_labels,
        })
      )
  }

  render() {
    //console.log(this.state)
    return this.state.mnist_embeddings && this.state.mnist_labels ? (
      <Layout
        {...this.state}
        algorithm_options={algorithm_options}
        algorithm_embedding_keys={algorithm_embedding_keys}
      />
    ) : (
      <div style={{ padding: '1rem' }}>Loading data...</div>
    )
  }
}

export default Data
