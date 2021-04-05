import React, { Component } from 'react'
import Sidebar from './Sidebar'
import Projection from './Projection'
import About from './About'
import * as _ from 'lodash'
import Axios from 'axios'

// padding constructor
function p(tb, lr) {
  return `${tb}px ${lr}px`
}

let color_array = [
  [141, 211, 199],
  [255, 255, 179],
  [190, 186, 218],
  [251, 128, 114],
  [128, 177, 211],
  [253, 180, 98],
  [179, 222, 105],
  [252, 205, 229],
  [188, 128, 189],
  [204, 235, 197],
]

class Layout extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ww: null,
      wh: null,
      sidebar_height: null,
      hover_index1: null,
      hover_index2: null,
      //show_about: null,
      algorithm_choice: 0,
    }
    this.sidebar_ctx = null
    this.setSize = _.debounce(this.setSize.bind(this), 200)
    this.checkHash = this.checkHash.bind(this)
    this.setSidebarCanvas1 = this.setSidebarCanvas1.bind(this)
    this.setSidebarCanvas2 = this.setSidebarCanvas2.bind(this)
    //this.toggleAbout = this.toggleAbout.bind(this)
    this.mustLink = this.mustLink.bind(this)

    this.selectAlgorithm = this.selectAlgorithm.bind(this)
  }

  selectAlgorithm(v) {
    let i = this.props.algorithm_options.indexOf(v)
    this.setState({ algorithm_choice: i })
  }

  setSize() {
    this.setState({ ww: window.innerWidth, wh: window.innerHeight })
    let sidebar_height = this.sidebar_mount.offsetHeight
    this.setState({ sidebar_height: sidebar_height })
    if (this.sidebar_ctx1) this.sidebar_ctx1.imageSmoothingEnabled = false
    if (this.sidebar_ctx2) this.sidebar_ctx2.imageSmoothingEnabled = false
  }

  setSidebarCanvas1(canvas) {
    let ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    this.sidebar_ctx1 = ctx
  }
  setSidebarCanvas2(canvas) {
    let ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    this.sidebar_ctx2 = ctx
  }
  /*
  clearSidebarCanvas(){
    console.log("hsn")
    this.props.clearIndex()
  }
  */

  mustLink(state){
    if (state === true) {
      Axios.post('http://localhost:5000/cons_clust', {
        index1:this.state.hover_index1,
        index2:this.state.hover_index2
      }).then(function(res) {
        console.log(res.data);
      })
      state = false
    } else if (state === false) {
      console.log("Noooooooooo!")
    }
  }

  toggleReset(state) {
    if (state === true) {
      // window.history.pushState(null, 'About UMAP Explorer', '#about')
      // this.setState({ show_about: true })
      Axios.post('http://localhost:5000/reset_button').then(function(res){
        console.log(res.data);
      })
      state = false
    } else if (state === false) {
      // window.history.pushState(null, 'UMAP Explorer', window.location.pathname)
      // this.setState({ show_about: false })
      console.log("Noooooooooo!")
    }
  }


  setHoverIndex1(hover_index) {
    this.setState({ hover_index1: hover_index })
  }

  setHoverIndex2(hover_index) {
    this.setState({ hover_index2: hover_index })
  }

  componentWillMount() {
    this.setSize()
    this.checkHash()
  }

  checkHash() {
    if (window.location.hash && window.location.hash === '#about') {
      this.setState({ show_about: true })
    } else {
      this.setState({ show_about: false })
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.setSize)
    window.addEventListener('popstate', this.checkHash)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize)
  }

  render() {
    let {
      mnist_embeddings,
      dim2_3,
      dim1_3,
      //tsne_mnist_embeddings,
      //md08_umap_mnist_embeddings,
      mnist_labels,
      algorithm_options,
      algorithm_embedding_keys,
    } = this.props
    let {
      ww,
      wh,
      sidebar_height,
      hover_index1,
      hover_index2,
      show_about,
      algorithm_choice,
    } = this.state
    let sidebar_ctx1 = this.sidebar_ctx1
    let sidebar_ctx2 = this.sidebar_ctx2

    let line_height = 1.5

    let sidebar_style = {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100vh',
      overflow: 'auto',
      background: '#222',
      display: 'flex',
      flexDirection: 'column',
    }
    let main_style = {
      position: 'relative',
      height: '100vh',
      background: '#111',
      overflow: 'hidden',
    }

    let sidebar_image_size, sidebar_orientation
    let font_size = 12
    if (ww < 800) {
      font_size = 14
      sidebar_style = {
        ...sidebar_style,
        flexDirection: 'row',
        width: '100%',
        top: 'auto',
        height: 'auto',
        bottom: 0,
      }
      main_style = { width: ww, height: wh - sidebar_height }
      sidebar_image_size = font_size * line_height * 3
      sidebar_orientation = 'horizontal'
    } else if (ww < 800 + 600) {
      let scaler = 200 + (300 - 200) * ((ww - 800) / 600)
      font_size = 14 + 2 * ((ww - 800) / 600)
      sidebar_style = {
        ...sidebar_style,
        width: scaler,
      }
      sidebar_image_size = sidebar_style.width
      main_style = {
        ...main_style,
        width: ww - scaler,
        left: scaler,
        height: wh,
      }
      sidebar_orientation = 'vertical'
    } else {
      sidebar_style = {
        ...sidebar_style,
        width: 300,
      }
      main_style = {
        ...main_style,
        width: ww - 300,
        left: 300,
        height: wh,
      }
      sidebar_image_size = sidebar_style.width
      sidebar_orientation = 'vertical'
    }

    let grem = font_size * line_height

    let general_style = {
      fontSize: font_size,
      lineHeight: line_height,
    }

    sidebar_image_size = sidebar_image_size/2

    return ww !== null ? (
      <div style={general_style}>
        <div
          style={sidebar_style}
          ref={sidebar_mount => {
            this.sidebar_mount = sidebar_mount
          }}
        >
          <Sidebar
            sidebar_orientation={sidebar_orientation}
            sidebar_image_size={sidebar_image_size}
            grem={grem}
            p={p}
            color_array={color_array}
            setSidebarCanvas1={this.setSidebarCanvas1}
            setSidebarCanvas2={this.setSidebarCanvas2}
            hover_index1={hover_index1}
            hover_index2={hover_index2}
            mnist_labels={mnist_labels}
            toggleReset={this.toggleReset}
            algorithm_options={algorithm_options}
            algorithm_choice={algorithm_choice}
            selectAlgorithm={this.selectAlgorithm}
            mustLink = {this.mustLink}
          />
        </div>
        <div style={main_style}>
          <Projection
            width={main_style.width}
            height={main_style.height}
            mnist_embeddings={mnist_embeddings}
            /*
            tsne_mnist_embeddings={tsne_mnist_embeddings}
            md08_umap_mnist_embeddings={md08_umap_mnist_embeddings}
            
            dim1_2={dim1_2}
            */
            dim2_3={dim2_3}
            dim1_3={dim1_3}

            mnist_labels={mnist_labels}
            color_array={color_array}
            sidebar_ctx1={sidebar_ctx1}
            sidebar_ctx2={sidebar_ctx2}
            sidebar_image_size={sidebar_image_size}
            setHoverIndex1={this.setHoverIndex1.bind(this)}
            setHoverIndex2={this.setHoverIndex2.bind(this)}
            algorithm_embedding_keys={algorithm_embedding_keys}
            algorithm_choice={algorithm_choice}
          />
        </div>
        {show_about ? (
          <About grem={grem} p={p} toggleAbout={this.toggleAbout} />
        ) : null}
      </div>
    ) : (
      <div style={{ padding: '1rem' }}>Loading layout...</div>
    )
  }
}

export default Layout
