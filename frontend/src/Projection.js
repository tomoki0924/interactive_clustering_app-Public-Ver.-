import React, { Component } from 'react'
import * as THREE from 'three'
import * as _ from 'lodash'
import * as d3 from 'd3'
import * as TWEEN from '@tweenjs/tween.js'

// kimura defined
 // var my_bool = false
 // var sprite_index2
 // var digit_index2

// tom defined
let ctx1_bool = false
let ctx2_bool = false
var global_sidebar_ctx1
var global_sidebar_ctx2

// highlightPoint用
//let vertices = ['undefined','undefined']
let texture_index = [0,0]


// Constants for sprite sheets
let sprite_side = 73 //縦横の文字の数
let sprite_size = sprite_side * sprite_side //png内の文字の数
let sprite_number = 1 //tile_pngの数
let sprite_image_size = 28 //1文字の縦横サイズ
// actual sprite size needs to be power of 2
let sprite_actual_size = 2048 //全ての文字の数

let mnist_tile_string = 'kmnist_tile_solid_'
let mnist_tile_locations = [...Array(sprite_number)].map(
  (n, i) => `${process.env.PUBLIC_URL}/${mnist_tile_string}${i}.png`
)

let mnist_images = mnist_tile_locations.map(src => {
  let img = document.createElement('img')
  img.src = src
  return img
})

let zoomScaler = input => {
  let scale1 = d3
    .scaleLinear()
    .domain([20, 5])
    .range([14, 28])
    .clamp(true)
  let scale2 = d3
    .scaleLinear()
    .domain([2, 0.1])
    .range([28, 56])
  if (input >= 5) {
    return scale1(input)
    // return 28
  } else if (input <= 2) {
    // return scale2(input)
    return 28
  } else {
    return 28
  }
}

class Projection extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.init = this.init.bind(this)
    this.addPoints = this.addPoints.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.sßetUpCamera = this.setUpCamera.bind(this)
    this.animate = this.animate.bind(this)
    this.getScaleFromZ = this.getScaleFromZ.bind(this)
    this.getZFromScale = this.getZFromScale.bind(this)
    this.changeEmbeddings = this.changeEmbeddings.bind(this)
    this.test1 = this.test1.bind(this)
    this.test2 = this.test2.bind(this)
  }

  changeEmbeddings(prev_choice, new_choice) {
    // assumes mnist embeddings has been updated

    let ranges = []
    for (let i = 0; i < sprite_number; i++) {
      let start = i * sprite_size
      let end = (i + 1) * sprite_size
      if (i === sprite_number - 1) end = sprite_number * sprite_size
      ranges.push([start, end])
    }

    let embedding_chunks = ranges.map(range =>
      this.props[this.props.algorithm_embedding_keys[new_choice]].slice(
        range[0],
        range[1]
      )
    )

    for (let c = 0; c < sprite_number; c++) {
      let echunk = embedding_chunks[c]
      console.log(this.scene.children[0].children[0])
      let points = this.scene.children[0].children[c]
      let numVertices = echunk.length
      let position = points.geometry.attributes.position.array
      let target = new Float32Array(numVertices * 3)
      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 3) {
        let x = echunk[i][0]
        let y = echunk[i][1]
        let z = 0
        target[index] = x
        target[index + 1] = y
        target[index + 2] = z
      }

      let tween = new TWEEN.Tween(position)
        .to(target, 1000)
        .easing(TWEEN.Easing.Linear.None)
      tween.onUpdate(function() {
        points.geometry.attributes.position = new THREE.BufferAttribute(
          position,
          3
        )
        points.geometry.attributes.position.needsUpdate = true // required after the first render
      })
      tween.start()
    }
  }

  getZFromScale(scale) {
    let rvFOV = THREE.Math.degToRad(this.camera.fov)
    let scale_height = this.props.height / scale
    let camera_z_position = scale_height / (2 * Math.tan(rvFOV / 2))
    return camera_z_position
  }

  getScaleFromZ(camera_z_position) {
    let rvFOV = THREE.Math.degToRad(this.camera.fov)
    let half_fov_height = Math.tan(rvFOV / 2) * camera_z_position
    let fov_height = half_fov_height * 2
    let scale = this.props.height / fov_height
    return scale
  }

  handleResize = (width, height) => {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    let current_scale = this.getScaleFromZ(this.camera.position.z)
    let d3_x = -(this.camera.position.x * current_scale) + this.props.width / 2
    let d3_y = this.camera.position.y * current_scale + this.props.height / 2
    var resize_transform = d3.zoomIdentity
      .translate(d3_x, d3_y)
      .scale(current_scale)
    let view = d3.select(this.mount)
    this.d3_zoom.transform(view, resize_transform)
  }

  zoomHandler() {
    let d3_transform = d3.event.transform
    //console.log(d3.event.transform)
    let scale = d3_transform.k
    let x = -(d3_transform.x - this.props.width / 2) / scale
    let y = (d3_transform.y - this.props.height / 2) / scale
    let z = this.getZFromScale(scale)

    this.camera.position.set(x, y, z)
    //console.log(this.camera.position)
    // point size scales at end of zoom
    let new_size = zoomScaler(z)
    let point_group = this.scene.children[0].children

    //console.log(point_group)
    //let point_group = this.scene2.children[0].children
    for (let c = 0; c < point_group.length; c++) {
      point_group[c].material.uniforms.size.value = new_size
    }
  }

  setUpCamera() {
    let { width, height, mnist_embeddings } = this.props

    let aspect = this.camera.aspect
    let vFOV = this.camera.fov
    let rvFOV = THREE.Math.degToRad(vFOV)

    let xs = mnist_embeddings.map(e => e[0])
    let min_x = _.min(xs)
    let max_x = _.max(xs)
    let ys = mnist_embeddings.map(e => e[1])
    let min_y = _.min(ys)
    let max_y = _.max(ys)
    let data_width = max_x - min_x
    let data_height = max_y - min_y
    let data_aspect = data_width / data_height

    console.log([min_x,max_x],[min_y,max_y])

    let max_x_from_center = _.max([min_x, max_x].map(m => Math.abs(m)))
    let max_y_from_center = _.max([min_y, max_y].map(m => Math.abs(m)))

    let max_center = Math.max(max_x_from_center, max_y_from_center)

    let camera_z_start
    if (data_aspect > aspect) {
      // console.log("width is limiter");
      // camera_z_start = max_x_from_center / Math.tan(rvFOV / 2) / aspect
    } else {
      // console.log("height is limiter");
      // camera_z_start = max_y_from_center / Math.tan(rvFOV / 2)
    }

    camera_z_start = max_center / Math.tan(rvFOV / 2)

    let far = camera_z_start * 1.25
    this.camera.far = far
    this.camera.position.z = camera_z_start * 1.1

    // set up zoom
    this.d3_zoom = d3
      .zoom()
      .scaleExtent([this.getScaleFromZ(far - 1), this.getScaleFromZ(0.1)])
      .on('zoom', this.zoomHandler.bind(this))

    let view = d3.select(this.mount)
    this.view = view
    view.call(this.d3_zoom)
    let initial_scale = this.getScaleFromZ(this.camera.position.z)
    var initial_transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(initial_scale)
    this.d3_zoom.transform(view, initial_transform)
  }
  
  addPoints() {
    let { mnist_embeddings, mnist_labels, color_array } = this.props

    // split embeddings and labels into chunks to match sprites
    let ranges = []
    for (let i = 0; i < sprite_number; i++) {
      let start = i * sprite_size
      let end = (i + 1) * sprite_size
      if (i === sprite_number - 1) end = sprite_number * sprite_size
      ranges.push([start, end])
    }
    
    let embedding_chunks = ranges.map(range =>
      mnist_embeddings.slice(range[0], range[1])
    )
    let label_chunks = ranges.map(range =>
      mnist_labels.slice(range[0], range[1])
    )

    // load the textures
    let loader = new THREE.TextureLoader()
    this.textures = mnist_tile_locations.map(l => {
      let t = loader.load(l)
      t.flipY = false
      t.magFilter = THREE.NearestFilter
      // t.minFilter = THREE.LinearMipMapLinearFilter;
      return t
    })

    let point_group = new THREE.Group()
    for (let c = 0; c < sprite_number; c++) {
      let echunk = embedding_chunks[c]
      let lchunk = label_chunks[c]

      let vertices = []
      for (let v = 0; v < echunk.length; v++) {
        let embedding = echunk[v]
        let vert = new THREE.Vector3(embedding[0], embedding[1], 0)
        vertices[v] = vert
      }

      let geometry = new THREE.BufferGeometry()

      let numVertices = vertices.length
      let positions = new Float32Array(numVertices * 3)
      let offsets = new Float32Array(numVertices * 2)
      let colors = new Float32Array(numVertices * 3)
      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 2))
      geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))

      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 3) {
        let x = echunk[i][0]
        let y = echunk[i][1]
        let z = 0
        positions[index] = x
        positions[index + 1] = y
        positions[index + 2] = z
      }

      // geometry.attributes.position.copyVector3sArray(vertices)

      let texture_subsize = 1 / sprite_side

      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 2) {
        let x = ((i % sprite_side) * sprite_image_size) / 2048
        let y =
          (Math.floor(i / sprite_side) * sprite_image_size) / 2048
        offsets[index] = x
        offsets[index + 1] = y
      }

      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 3) {
        let color = color_array[lchunk[i]]
        colors[index] = color[0] / 255
        colors[index + 1] = color[1] / 255
        colors[index + 2] = color[2] / 255
      }

      // uniforms
      let uniforms = {
        texture: { value: this.textures[c] },
        repeat: { value: new THREE.Vector2(texture_subsize, texture_subsize) },
        size: { value: sprite_image_size },
      }

      let vertex_shader = `
        attribute vec2 offset;
        varying vec2 vOffset;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float size;
        void main() {
          vOffset = offset;
          vColor = color;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`

      let fragment_shader = `
        uniform sampler2D texture;
        uniform vec2 repeat;
        varying vec2 vOffset;
        varying vec3 vColor;
        void main() {
          vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
          vec4 tex = texture2D( texture, uv * repeat + vOffset );
          if ( tex.r < 0.5 ) discard;
          tex.r = 1.0;
          tex.g = 1.0;
          tex.b = 1.0;
          gl_FragColor = tex * vec4(vColor, 1.0);
        }`

      // material
      let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex_shader,
        fragmentShader: fragment_shader,
      })

      // point cloud
      let point_cloud = new THREE.Points(geometry, material)
      point_cloud.userData = { sprite_index: c }

      point_group.add(point_cloud)
    }

    this.scene.add(point_group)

    console.log(point_group)

  }
/*
  addBlankHighlightPoints() {
    let hover_container = new THREE.Group()

    this.scene.add(hover_container)
    //this.scene2.add(hover_container)

    console.log(new THREE.Group())
    console.log(hover_container)

    let vert = []
    let vert1 = new THREE.Vector3(0, 0, 0)
    let vert2 = new THREE.Vector3(0, 0, 0)
    vert[0] = vert1
    vert[1] = vert2
    let geometry = new THREE.BufferGeometry()
    let numVertices = vert.length
    var positions = new Float32Array(numVertices * 3) // 3 coordinates per point
    var offsets = new Float32Array(numVertices * 2) // 2 coordinates per point
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 2))

    // all the attributes will be filled on hover
    let texture_subsize = 1 / sprite_side

    // uniforms
    let uniforms = {
      texture: { value: this.textures[0] },
      repeat: { value: new THREE.Vector2(texture_subsize, texture_subsize) },
      size: { value: 56.0 },
    }

    let vertex_shader = `
        attribute vec2 offset;
        varying vec2 vOffset;
        uniform float size;
        void main() {
          vOffset = offset;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`

    let fragment_shader = `
        uniform sampler2D texture;
        uniform vec2 repeat;
        varying vec2 vOffset;
        void main() {
          vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
          vec4 tex = texture2D( texture, uv * repeat + vOffset );
          tex.a = tex.r;
          tex.r = 1.0;
          tex.g = 1.0;
          tex.b = 1.0;
          gl_FragColor = tex;
        }`

    // material
    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertex_shader,
      fragmentShader: fragment_shader,
      transparent: true,
    })

    let point = new THREE.Points(geometry, material)
    point.frustumCulled = false

    this.scene.children[1].visible = false
    this.scene.children[1].add(point)

    console.log(this.scene.children[1])
    //this.scene2.children[1].visible = false
    //this.scene2.children[1].add(point)
  }
*/
  
  addBlankHighlightPoints1() {
  
    for (let c = 0; c<texture_index.length; c++) {

      let hover_container = new THREE.Group()
      this.scene.add(hover_container)


      let vert = new THREE.Vector3(0, 0, 0)
      let verty = [vert]

      let geometry = new THREE.BufferGeometry()

      let numVertices = verty.length
      let positions = new Float32Array(numVertices * 3)
      let offsets = new Float32Array(numVertices * 2)
      // let colors = new Float32Array(numVertices * 3)
      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 2))
     
     let texture_subsize = 1 / sprite_side


      // uniforms
      let uniforms = {
        texture: { value: this.textures[0] },
        repeat: { value: new THREE.Vector2(texture_subsize, texture_subsize) },
        size: { value: 56.0 },
      }

        let vertex_shader = `
        attribute vec2 offset;
        varying vec2 vOffset;
        uniform float size;
        void main() {
          vOffset = offset;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`

    let fragment_shader = `
        uniform sampler2D texture;
        uniform vec2 repeat;
        varying vec2 vOffset;
        void main() {
          vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
          vec4 tex = texture2D( texture, uv * repeat + vOffset );
          tex.a = tex.r;
          tex.r = 1.0;
          tex.g = 1.0;
          tex.b = 1.0;
          gl_FragColor = tex;
        }`

      // material
      let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex_shader,
        fragmentShader: fragment_shader,
        transparent: true,
      })

      // point cloud
      let point = new THREE.Points(geometry, material)
      point.frustumCulled = false
      //point.userData = { sprite_index: c }

      //point_group.add(point)
      this.scene.children[c+1].visible = false
      this.scene.children[c+1].add(point)

    }
 
  }

  

  highlightPoint(sprite_index, digit_index, full_index, intersect_number) {
    let { algorithm_embedding_keys, algorithm_choice } = this.props

    let point = this.scene.children[intersect_number+1].children[0]

    texture_index[intersect_number] = sprite_index

    console.log(this.props[algorithm_embedding_keys[algorithm_choice]][full_index])
    let embedding = this.props[algorithm_embedding_keys[algorithm_choice]][
      full_index
    ]

    let vert = new THREE.Vector3(embedding[0], embedding[1], 0)
    let vertices= [vert]

    var offsets = new Float32Array(2)
    let x = ((digit_index % sprite_side) * 28) / sprite_actual_size
    let y = (Math.floor(digit_index / sprite_side) * 28) / sprite_actual_size
    offsets[0] = x
    offsets[1] = y

    point.geometry.attributes.position.copyVector3sArray(vertices)
    point.geometry.attributes.position.needsUpdate = true // required after the first render
    point.geometry.attributes.offset.array = offsets
    point.geometry.attributes.offset.needsUpdate = true // required after the first render

    console.log(point.geometry.attributes)

    // need to set attributes on geometry and uniforms on material
    point.material.uniforms.texture.value = this.textures[sprite_index]

    
  }

//クリック時動く
  checkIntersects1(mouse_position) {
    //console.log(mouse_position)
    let { width, height, sidebar_ctx1, sidebar_image_size } = this.props
    global_sidebar_ctx1 = sidebar_ctx1
    function mouseToThree([mouseX, mouseY]) {
      return new THREE.Vector3(
        (mouseX / width) * 2 - 1,
        -(mouseY / height) * 2 + 1,
        1
      )
    }

    function sortIntersectsByDistanceToRay(intersects) {
      return _.sortBy(intersects, 'distanceToRay')
    }

    let mouse_vector = mouseToThree(mouse_position)
    this.raycaster.setFromCamera(mouse_vector, this.camera)
    this.raycaster.params.Points.threshold = 0.25
    let intersects = this.raycaster.intersectObjects(
    this.scene.children[0].children
    )
      // console.log(123,this.scene.children[0])
      // console.log(1234, intersects[0])
    if (intersects[0]) { //画像をクリックしたか
      let sorted_intersects = sortIntersectsByDistanceToRay(intersects)
      let intersect = sorted_intersects[0]
      let sprite_index = intersect.object.userData.sprite_index //tile_number
      let digit_index = intersect.index
      let full_index = sprite_index * sprite_size + digit_index
      console.log(full_index)
      this.props.setHoverIndex1(full_index)
      sidebar_ctx1.fillRect(0, 0, sidebar_image_size, sidebar_image_size)
      this.highlightPoint(sprite_index, digit_index, full_index, 0)
      this.scene.children[1].visible =  true
      console.log(this.scene.children[1])
      //console.log(114514,my_bool)
      sidebar_ctx1.drawImage(
        mnist_images[sprite_index],
        // source rectangle
        (digit_index % sprite_side) * sprite_image_size,
        Math.floor(digit_index / sprite_side) * sprite_image_size,
        sprite_image_size,
        sprite_image_size,
        // destination rectangle
        0,
        0,
        sidebar_image_size,
        sidebar_image_size
      )
      ctx1_bool = true
      // console.log("kmr")
      // console.log(sprite_index , sprite_size , digit_index)
    }else {
      this.props.setHoverIndex1(null)
      this.scene.children[1].visible = false
      sidebar_ctx1.fillRect(0, 0, sidebar_image_size, sidebar_image_size)
    }  
  }

  checkIntersects2(mouse_position) {
    let { width, height, sidebar_ctx2, sidebar_image_size } = this.props
    global_sidebar_ctx2 = sidebar_ctx2
    function mouseToThree([mouseX, mouseY]) {
      return new THREE.Vector3(
        (mouseX / width) * 2 - 1,
        -(mouseY / height) * 2 + 1,
        1
      )
    }

    function sortIntersectsByDistanceToRay(intersects) {
      return _.sortBy(intersects, 'distanceToRay')
    }

    let mouse_vector = mouseToThree(mouse_position)
    this.raycaster.setFromCamera(mouse_vector, this.camera)
    this.raycaster.params.Points.threshold = 0.25
    let intersects = this.raycaster.intersectObjects(
      this.scene.children[0].children
    )

    if (intersects[0]) {
      let sorted_intersects = sortIntersectsByDistanceToRay(intersects)
      let intersect = sorted_intersects[0]
      console.log(intersect)
      let sprite_index = intersect.object.userData.sprite_index
      let digit_index = intersect.index
      let full_index = sprite_index * sprite_size + digit_index
      this.props.setHoverIndex2(full_index)
      sidebar_ctx2.fillRect(0, 0, sidebar_image_size, sidebar_image_size)
      this.highlightPoint(sprite_index, digit_index, full_index, 1)
      this.scene.children[2].visible =  true
      //console.log(114514,my_bool)
      sidebar_ctx2.drawImage(
        mnist_images[sprite_index],
        // source rectangle
        (digit_index % sprite_side) * sprite_image_size,
        Math.floor(digit_index / sprite_side) * sprite_image_size,
        sprite_image_size,
        sprite_image_size,
        // destination rectangle
        0,
        0,
        sidebar_image_size,
        sidebar_image_size
      )
      ctx2_bool = true
      console.log(sprite_index, sprite_size, digit_index)
    }else {
      this.props.setHoverIndex2(null)
      this.scene.children[2].visible = false
      sidebar_ctx2.fillRect(0, 0, sidebar_image_size, sidebar_image_size)
    }  
  }

  handleMouse() {
    let view = d3.select(this.renderer.domElement)

    this.raycaster = new THREE.Raycaster()

    view.on('mousemove', () => {
      let [mouseX, mouseY] = d3.mouse(view.node())
      let mouse_position = [mouseX, mouseY]
      this.checkIntersects(mouse_position)
    })
  }

  handleClick() {
    let view = d3.select(this.renderer.domElement)

    this.raycaster = new THREE.Raycaster()

    view.on('click', () => {
      let [mouseX, mouseY] = d3.mouse(view.node())
      let mouse_position = [mouseX, mouseY]
      // if(Clear1_bool){
      //   console.log("hand_cli")
      //   this.test()
      // }else 
      if(!ctx1_bool){
        this.checkIntersects1(mouse_position)
      }else if(!ctx2_bool){
        this.checkIntersects2(mouse_position)
        console.log(this.scene)
      }
    })
    
  }


  test1() {
    let sidebar_image_size = 985.8333333333334 

    global_sidebar_ctx1.fillRect(0, 0, sidebar_image_size, sidebar_image_size)
  }

  test2() {
    let sidebar_image_size = 985.8333333333334

    global_sidebar_ctx2.fillRect(0, 0, sidebar_image_size, sidebar_image_size)
  }

  Clear1() {

    //表示絵をなくす処理
    this.test1()
    //console.log(1)
    ctx1_bool = false
  }

  Clear2() {
    // //表示絵をなくす処理
    this.test2()
    ctx2_bool = false
  }

  init() {
    let { width, height } = this.props

    this.scene = new THREE.Scene()
    //this.scene2 = new THREE.Scene()
    //console.log(new THREE.Scene())

    let vFOV = 75
    let aspect = width / height
    let near = 0.01
    let far = 1000

    this.camera = new THREE.PerspectiveCamera(vFOV, aspect, near, far)

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x111111, 1)
    this.renderer.setSize(width, height)
    this.mount.appendChild(this.renderer.domElement)

    this.addPoints()

    this.addBlankHighlightPoints1()

    this.setUpCamera()

    this.animate()

    //this.handleMouse()

    this.handleClick()

    //this.test()

  }

  animate() {
    requestAnimationFrame(this.animate)
    TWEEN.update()
    this.renderer.render(this.scene, this.camera)
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate(prevProps) {
    let { width, height } = this.props
    if (width !== prevProps.width || height !== prevProps.height) {
      this.handleResize(width, height)
    }
    if (prevProps.algorithm_choice !== this.props.algorithm_choice) {
      this.changeEmbeddings(
        prevProps.algorithm_choice,
        this.props.algorithm_choice
      )
    }
  }

  componentWillUnmount() {
    this.mount.removeChild(this.renderer.domElement)
  }

  render() {
    let { width, height } = this.props
    return (
      <div
        style={{ width: width, height: height, overflow: 'hidden' }}
        ref={mount => {
          this.mount = mount
        }}
      />
    )
  }
}

export default Projection

