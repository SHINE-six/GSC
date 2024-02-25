import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import GUI from 'lil-gui'
import * as CANNON from 'cannon-es'

/**
 * Debug
 */
const gui = new GUI()
const debugObject = {}
debugObject.RainLevel = 1
debugObject.DrainSphereWaterAllowed = 5
debugObject.simulateRain = () => {
    for (let i = 0; i < 200; i++) {
        for (let j = 0; j < debugObject.RainLevel; j++) {
            const randomX = (Math.random() - 0.5) * 100
            const randomZ = (Math.random() - 0.5) * 100
            setTimeout(() => {
                createSphere(new CANNON.Vec3(randomX, 50, randomZ), cannonMaterial_rainWater)
            }, i * 50); // Add a delay based on the index of the sphere
        }
    }
}
debugObject.simulateFloodFromPond = () => {
    for(let i = 0; i < 500; i++) {
        const randomX = (Math.random() - 0.5) * 20
        const randomZ = Math.random() - 0.5 + 39
        createSphere(new CANNON.Vec3(randomX, 0.2, randomZ), cannonMaterial_floodWater)
    }
}
debugObject.clear = () => {
    for(const object of objectsToUpdate)
    {
        scene.remove(object.mesh)
        world.removeBody(object.body)
    }
}
debugObject.suggestInlet = () => {
    HolePosition.push(new THREE.Vector3(13, 0.5, 3))
    AllHoleMesh.push(createHole(HolePosition[HolePosition.length - 1]))
    console.log(HolePosition)
}

gui.add(debugObject, 'DrainSphereWaterAllowed').min(2).max(10).step(1)
gui.add(debugObject, 'suggestInlet')
gui.add(debugObject, 'RainLevel').min(1).max(7).step(1)
gui.add(debugObject, 'simulateRain')
gui.add(debugObject, 'simulateFloodFromPond')
gui.add(debugObject, 'clear')

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
const gltfLoader = new GLTFLoader()
gltfLoader.load(
    './models/city/scene.gltf',
    (gltf) =>
    {
        gltf.scene.scale.set(0.01, 0.01, 0.01)
        scene.add(gltf.scene)
        console.log(gltf)
    }
)
gltfLoader.load(
    './models/metro_station/scene.gltf',
    (gltf) =>
    {
        gltf.scene.scale.set(0.5, 0.8, 0.6)
        gltf.scene.position.set(18, 0.5, -16)
        gltf.scene.rotation.y = - Math.PI * 0.5
        scene.add(gltf.scene)
        console.log(gltf)
    }
)
// gltfLoader.load(
//     './models/low_poly_farm/scene.gltf',
//     (gltf) =>
//     {
//         gltf.scene.scale.set(0.7, 0.5, 0.5)
//         gltf.scene.position.set(0, -15, 0)
//         scene.add(gltf.scene)
//         console.log(gltf)
//     }
// )
var model, carBody
gltfLoader.load(
    './models/car/scene.gltf',
    (gltf) =>
    {
        model = gltf.scene

        model.scale.set(0.01, 0.01, 0.01)
        scene.add(model)
        console.log(gltf)

        model.position.set(5, 0, 30)

        // Create a CANNON.js body for the model
        carBody = new CANNON.Body({ 
            mass: 1, 
            material: cannonMaterial_ground,
            shape: new CANNON.Box(new CANNON.Vec3(2.5, 1.5, 1))
        })
        carBody.position.copy(model.position)
        carBody.position.y = 3
        world.addBody(carBody)
    }
)
// const meshBody = new THREE.Mesh(
//     new THREE.BoxGeometry(5, 3, 2),
//     new THREE.MeshStandardMaterial({ color: '#ff0000' })
// );
// meshBody.position.set(-5, 1.5, 30)
// scene.add(meshBody);
/**
 * Physics World
 */
const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set(0, -9.82, 0)

// Materials
const cannonMaterial_floodWater = new CANNON.Material('floodWater')
const cannonMaterial_rainWater = new CANNON.Material('rainWater')
const cannonMaterial_ground = new CANNON.Material('ground')
const contactMaterial_floodWater_ground = new CANNON.ContactMaterial(
    cannonMaterial_floodWater, 
    cannonMaterial_ground,
    {
        friction: 0.001,
        restitution: 0.9
    }
)
world.addContactMaterial(contactMaterial_floodWater_ground)

const contactMaterial_rainWater_ground = new CANNON.ContactMaterial(
    cannonMaterial_rainWater,
    cannonMaterial_ground,
    {
        friction: 0.001,
        restitution: 0.01
    }
)
world.addContactMaterial(contactMaterial_rainWater_ground)

// Create a plane body in Cannon.js
var planeShape = new CANNON.Plane();
var planeBody = new CANNON.Body({ material: cannonMaterial_ground, shape: planeShape }); // static body
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1,0,0), Math.PI * 0.5)
planeBody.position.y = 0.2
world.addBody(planeBody);

// // Box 1
// var boxShape1 = new CANNON.Box(new CANNON.Vec3(15, 0.1, 50))
// var boxBody1 = new CANNON.Body({ mass: 0 }); // static body
// boxBody1.addShape(boxShape1);
// boxBody1.position.set(-60,0,-10); // Position it to form one side of the hole
// // world.addBody(boxBody1);

// const demo1 = new THREE.Mesh(
//     new THREE.BoxGeometry(30, 0.1, 100),
//     new THREE.MeshStandardMaterial({
//         color: '#eedd33',
//         metalness: 0.3,
//         roughness: 0.4,
//         envMapIntensity: 0.5
//     })
// )
// demo1.position.set(-60,10,-10)
// // scene.add(demo1)

// // Box 2
// var boxShape2 = new CANNON.Box(new CANNON.Vec3(15, 0.1, 30))
// var boxBody2 = new CANNON.Body({ mass: 0 }); // static body
// boxBody2.addShape(boxShape2);
// boxBody2.position.set(-30,0,9); // Position it to form the opposite side of the hole
// // world.addBody(boxBody2);

// const demo2 = new THREE.Mesh(
//     new THREE.BoxGeometry(30, 0.1, 60),
//     new THREE.MeshStandardMaterial({
//         color: '#1edd33',
//         metalness: 0.3,
//         roughness: 0.4,
//         envMapIntensity: 0.5
//     })
// )
// demo2.position.set(-30,10,9)
// // scene.add(demo2)

// // Box 3
// var boxShape3 = new CANNON.Box(new CANNON.Vec3(15, 0.1, 17.5))
// var boxBody3 = new CANNON.Body({ mass: 0 }); // static body
// boxBody3.addShape(boxShape3);
// boxBody3.position.set(-30,0,-42); // Position it to form the opposite side of the hole
// // world.addBody(boxBody3);

// const demo3 = new THREE.Mesh(
//     new THREE.BoxGeometry(30, 0.1, 35),
//     new THREE.MeshStandardMaterial({
//         color: '#fead33',
//         metalness: 0.3,
//         roughness: 0.4,
//         envMapIntensity: 0.5
//     })
// )
// demo3.position.set(-30,10,-43)
// // scene.add(demo3)




/**
 * Mesh World - Objects
 */

// Floor
// const floor = new THREE.Mesh(
//     new THREE.PlaneGeometry(135, 100),
//     new THREE.MeshStandardMaterial({
//         color: '#777777',
//         metalness: 0.3,
//         roughness: 0.4,
//         envMapIntensity: 0.5
//     })
// )
// // floor.receiveShadow = true
// floor.rotation.x = - Math.PI * 0.5
// floor.position.set(-10,0,-10)
// scene.add(floor)

// Ponds
const pondGeometry = new THREE.PlaneGeometry(100, 20);
const pondMaterial = new THREE.MeshStandardMaterial({ color: '#0000ff' })
const pond = new THREE.Mesh(pondGeometry, pondMaterial)
pond.rotation.x = - Math.PI * 0.5
pond.position.set(0, 0.1, 40)
scene.add(pond)

/**
 * Street Inlet Hole
*/


// Hole
const HolePosition = [
    (new THREE.Vector3(-13, 0.5, 23)), 
    (new THREE.Vector3(3, 0.5, 3)),
    (new THREE.Vector3(3, 0.5, -40)),
    (new THREE.Vector3(-23, 0.5, -38))
]

const createHole = (position) => {
    const HoleGroup = new THREE.Group()
    const HoleGeometry = new THREE.PlaneGeometry(2, 2);
    const HoleMaterial = new THREE.MeshStandardMaterial({ color: '#ff00ff' })
    const Hole = new THREE.Mesh(HoleGeometry, HoleMaterial)
    Hole.rotation.x = - Math.PI * 0.5
    HoleGroup.add(Hole)

    const HoleGeometry_pipe = new THREE.CylinderGeometry(0.5, 0.5, 10, 32);
    const HoleMaterial_pipe = new THREE.MeshStandardMaterial({ color: '#ff00ff' })
    const Hole_pipe = new THREE.Mesh(HoleGeometry_pipe, HoleMaterial_pipe)
    Hole_pipe.position.set(0, -10, 0)
    HoleGroup.add(Hole_pipe)

    HoleGroup.position.copy(position)
    scene.add(HoleGroup)
    return Hole
}

const AllHoleMesh = []

for (let i = 0; i < HolePosition.length; i++) {
    AllHoleMesh.push(createHole(HolePosition[i]))
}

/**
 * Storm Sewer
 */
const stormSewerGeometry = new THREE.BoxGeometry(5, 5, 100)
const stormSewerMaterial = new THREE.MeshStandardMaterial({ color: '#ff0000', transparent: true, opacity: 0.5 })
const stormSewer = new THREE.Mesh(stormSewerGeometry, stormSewerMaterial)
stormSewer.position.set(5, -15, 0)
scene.add(stormSewer)

/**
 * Water in Storm Sewer
 */
const waterGeometry = new THREE.BoxGeometry(4, 0.1, 101)
const waterMaterial = new THREE.MeshStandardMaterial({ color: '#0000ff' })
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.position.set(5, -17, 0)
scene.add(water)


// Car
// const carGeometry = new THREE.BoxGeometry(2, 2, 4)
// const carMaterial = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const car = new THREE.Mesh(carGeometry, carMaterial)
// car.position.set(5, 0.5, 30)
// scene.add(car)

// const carShape = new CANNON.Box(new CANNON.Vec3(1, 1, 2))
// const carBody = new CANNON.Body({ mass: 0.3, material: cannonMaterial_ground})
// carBody.addShape(carShape)
// carBody.position.set(5, 0.5, 30)
// world.addBody(carBody)

// Test Block
// const block1Geometry = new THREE.BoxGeometry(0.5, 5, 100)
// const block1Material = new THREE.MeshStandardMaterial({ color: '#ff0000'})
// const block1 = new THREE.Mesh(block1Geometry, block1Material)
// block1.position.set(60, 15, -10)
// scene.add(block1)

// const blockGeometry = new THREE.BoxGeometry(140, 5, 0.5)
// const blockMaterial = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const block = new THREE.Mesh(blockGeometry, blockMaterial)
// block.position.set(-10, 15, -60)
// scene.add(block)

// const block2Geometry = new THREE.BoxGeometry(0.5, 5, 100)
// const block2Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const block2 = new THREE.Mesh(block2Geometry, block2Material)
// block2.position.set(-80, 15, -10)
// scene.add(block2)

// const block3Geometry = new THREE.BoxGeometry(140, 5, 0.5)
// const block3Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const block3 = new THREE.Mesh(block3Geometry, block3Material)
// block3.position.set(-10, 15, 40)
// scene.add(block3)

// Cannon.js bodies
const block1Shape = new CANNON.Box(new CANNON.Vec3(0.5, 5, 50))
const block1Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
block1Body.addShape(block1Shape)
block1Body.position.set(60, 0, -10)
world.addBody(block1Body)

const blockShape = new CANNON.Box(new CANNON.Vec3(70, 5, 0.5))
const blockBody = new CANNON.Body({ mass: 0, material: cannonMaterial_ground })
blockBody.addShape(blockShape)
blockBody.position.set(-10, 0, -60)
world.addBody(blockBody)

const block2Shape = new CANNON.Box(new CANNON.Vec3(0.5, 5, 50))
const block2Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground })
block2Body.addShape(block2Shape)
block2Body.position.set(-80, 0, -10)
world.addBody(block2Body)

const block3Shape = new CANNON.Box(new CANNON.Vec3(70, 5, 0.5))
const block3Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground })
block3Body.addShape(block3Shape)
block3Body.position.set(-10, 0, 40)
world.addBody(block3Body)

/**
 * Building 
 */
// const building1Geometry = new THREE.BoxGeometry(15, 15, 15)
// const building1Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building1 = new THREE.Mesh(building1Geometry, building1Material)
// building1.position.set(-6, 7.5, -16)
// scene.add(building1)

const building1Shape = new CANNON.Box(new CANNON.Vec3(7.5, 7.5, 7.5))
const building1Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building1Body.addShape(building1Shape)
building1Body.position.set(-6, 7.5, -16)
building1Body.collisionCounter = 0
world.addBody(building1Body)

// const building2Geometry = new THREE.BoxGeometry(10, 15, 15)
// const building2Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building2 = new THREE.Mesh(building2Geometry, building2Material)
// building2.position.set(37, 7.5, 13)
// scene.add(building2)

const building2Shape = new CANNON.Box(new CANNON.Vec3(5, 7.5, 7.5))
const building2Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building2Body.addShape(building2Shape)
building2Body.position.set(37, 7.5, 13)
building2Body.collisionCounter = 0
world.addBody(building2Body)

// const building3Geometry = new THREE.BoxGeometry(7, 7, 11)
// const building3Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building3 = new THREE.Mesh(building3Geometry, building3Material)
// building3.position.set(18, 3.5, -16)
// scene.add(building3)

const building3Shape = new CANNON.Box(new CANNON.Vec3(3.5, 3.5, 5.5))
const building3Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building3Body.addShape(building3Shape)
building3Body.position.set(18, 3.5, -16)
building3Body.collisionCounter = 0
world.addBody(building3Body)

// const building4Geometry = new THREE.BoxGeometry(13, 7, 10)
// const building4Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building4 = new THREE.Mesh(building4Geometry, building4Material)
// building4.position.set(33, 3.5, -16)
// scene.add(building4)

const building4Shape = new CANNON.Box(new CANNON.Vec3(6.5, 3.5, 5))
const building4Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building4Body.addShape(building4Shape)
building4Body.position.set(33, 3.5, -16)
building4Body.collisionCounter = 0
world.addBody(building4Body)

// const building5Geometry = new THREE.BoxGeometry(7, 5, 5)
// const building5Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building5 = new THREE.Mesh(building5Geometry, building5Material)
// building5.position.set(-2, 2.5, 19)
// scene.add(building5)

const building5Shape = new CANNON.Box(new CANNON.Vec3(3.5, 2.5, 2.5))
const building5Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building5Body.addShape(building5Shape)
building5Body.position.set(-2, 2.5, 19)
building5Body.collisionCounter = 0
world.addBody(building5Body)

// const building6Geometry = new THREE.BoxGeometry(12, 12, 7)
// const building6Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building6 = new THREE.Mesh(building6Geometry, building6Material)
// building6.position.set(-27, 6, 17)
// scene.add(building6)

const building6Shape = new CANNON.Box(new CANNON.Vec3(6, 6, 3.5))
const building6Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building6Body.addShape(building6Shape)
building6Body.position.set(-27, 6, 17)
building6Body.collisionCounter = 0
world.addBody(building6Body)

// const building7Geometry = new THREE.BoxGeometry(13, 7, 10)
// const building7Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building7 = new THREE.Mesh(building7Geometry, building7Material)
// building7.position.set(50, 3.5, -16)
// scene.add(building7)

const building7Shape = new CANNON.Box(new CANNON.Vec3(6.5, 3.5, 5))
const building7Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building7Body.addShape(building7Shape)
building7Body.position.set(50, 3.5, -16)
building7Body.collisionCounter = 0
world.addBody(building7Body)

// const building8Geometry = new THREE.BoxGeometry(15, 15, 15)
// const building8Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building8 = new THREE.Mesh(building8Geometry, building8Material)
// building8.position.set(20, 7.5, -45)
// scene.add(building8)

const building8Shape = new CANNON.Box(new CANNON.Vec3(7.5, 7.5, 7.5))
const building8Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building8Body.addShape(building8Shape)
building8Body.position.set(20, 7.5, -45)
building8Body.collisionCounter = 0
world.addBody(building8Body)

// const building9Geometry = new THREE.BoxGeometry(15, 15, 15)
// const building9Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building9 = new THREE.Mesh(building9Geometry, building9Material)
// building9.position.set(48, 7.5, -45)
// scene.add(building9)

const building9Shape = new CANNON.Box(new CANNON.Vec3(7.5, 7.5, 7.5))
const building9Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building9Body.addShape(building9Shape)
building9Body.position.set(48, 7.5, -45)
building9Body.collisionCounter = 0
world.addBody(building9Body)

// const building10Geometry = new THREE.BoxGeometry(11, 7, 7)
// const building10Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building10 = new THREE.Mesh(building10Geometry, building10Material)
// building10.position.set(-7, 3.5, -47)
// scene.add(building10)

const building10Shape = new CANNON.Box(new CANNON.Vec3(5.5, 3.5, 3.5))
const building10Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building10Body.addShape(building10Shape)
building10Body.position.set(-7, 3.5, -47)
building10Body.collisionCounter = 0
world.addBody(building10Body)

// const building11Geometry = new THREE.BoxGeometry(11, 7, 7)
// const building11Material = new THREE.MeshStandardMaterial({ color: '#ff0000' })
// const building11 = new THREE.Mesh(building11Geometry, building11Material)
// building11.position.set(-29, 3.5, -47)
// scene.add(building11)

const building11Shape = new CANNON.Box(new CANNON.Vec3(5.5, 3.5, 3.5))
const building11Body = new CANNON.Body({ mass: 0, material: cannonMaterial_ground})
building11Body.addShape(building11Shape)
building11Body.position.set(-29, 3.5, -47)
building11Body.collisionCounter = 0
world.addBody(building11Body)


const buildingCannon = [building1Body, building2Body, building3Body, building4Body, building5Body, building6Body, building7Body, building8Body, building9Body, building10Body, building11Body]
var textMesh1, textMesh2, textMesh3, textMesh4, textMesh5, textMesh6, textMesh7, textMesh8, textMesh9, textMesh10, textMesh11
var AllTextMesh = [textMesh1, textMesh2, textMesh3, textMesh4, textMesh5, textMesh6, textMesh7, textMesh8, textMesh9, textMesh10, textMesh11];
const fontLoader = new FontLoader()
fontLoader.load('/fonts/helvetiker_regular.typeface.json', (font) => {

    const updateTextMesh = (buildingBody) => {
        var buildingDamageStatus
        if (buildingBody.collisionCounter <= 10) {
            buildingDamageStatus = 'Safe';
        } else if (buildingBody.collisionCounter <= 20) {
            buildingDamageStatus = 'Minor Damage';
        } else if (buildingBody.collisionCounter <= 40) {
            buildingDamageStatus = 'Moderate Damage';
        } else if (buildingBody.collisionCounter <= 60) {
            buildingDamageStatus = 'Major Damage';
        } else {
            buildingDamageStatus = 'Critical Damage';
        }
        



        const textGeometry = new TextGeometry(buildingDamageStatus, {
            font: font,
            size: 1,
            height: 0.2,
            curveSegments: 5,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 3
        });
        textGeometry.center();
        const textMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff' })
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)
        // textMesh.geometry = textGeometry; // Assign the new geometry
        textMesh.position.set(buildingBody.position.x, buildingBody.position.y + 10, buildingBody.position.z)
        return textMesh;
    };
    
    for (let i = 0; i < buildingCannon.length; i++) {
        const buildingBody = buildingCannon[i];
        buildingBody.addEventListener('collide', function(e) {
            buildingBody.collisionCounter++;
            if (AllTextMesh[i]) { // Because for the first time, textMesh is undefined, cannot run remove() on it
                scene.remove(AllTextMesh[i]);
                AllTextMesh[i].geometry.dispose(); // Dispose the old geometry
            }
            AllTextMesh[i] = updateTextMesh(buildingBody, AllTextMesh[i]); // Update the text mesh
            scene.add(AllTextMesh[i]);
        });
    }
})

const createBuildingStatus = (position) => {
    const buildingStatus = new THREE.Mesh(
        new THREE.CircleGeometry(3, 32),
        new THREE.MeshStandardMaterial({ color: '#00ff00' })
    )
    buildingStatus.position.set(position.x, position.y + 10, position.z)
    scene.add(buildingStatus)

    return buildingStatus;
}

// const allBuilding = [building1, building2, building3, building4, building5, building6, building7, building8, building9, building10, building11]
const allBuildingStatus = []

for (let i = 0; i < buildingCannon.length; i++) {
    allBuildingStatus.push(createBuildingStatus(buildingCannon[i].position));
}


/**
 * Create both a Three.js and Cannon.js sphere
 */
const objectsToUpdate = []

// Three.js sphere
const sphereGeometry = new THREE.SphereGeometry(0.5, 3, 2)
const sphereMaterial = new THREE.MeshStandardMaterial({ color: '#0000ff' })

const createSphere = (position, cannonMaterial) => {
    // Three.js mesh
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.copy(position)
    scene.add(sphere)

    // Cannon.js body
    const shape = new CANNON.Sphere(0.14)
    const body = new CANNON.Body({
        material: cannonMaterial,
        mass: 1,
        shape
    })
    body.position.copy(position)
    world.addBody(body)
    objectsToUpdate.push({ mesh: sphere, body })

}


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)



/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 70, 0)
camera.far = 5000
camera.updateProjectionMatrix();
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



/**
 * Animate
 */
const DrainSphereWaterAllowed = []
for (let i = 0; i < HolePosition.length; i++) {
    DrainSphereWaterAllowed.push(debugObject.DrainSphereWaterAllowed);
}


const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime


    // Rotate camera 360 degrees around center point
    // const radius = 17; // Replace with desired radius
    // const center = new THREE.Vector3(-10, 0, 0); // Replace with desired center point
    // const angle = (elapsedTime % 10) * (Math.PI / 5); // Replace with desired rotation speed

    // camera.position.x = center.x + radius * Math.cos(angle) * 5
    // camera.position.z = center.z + radius * Math.sin(angle) * 5
    // camera.lookAt(center);
    

    // Update physics world
    world.step(1 / 60, deltaTime, 3)
    // const randomX = Math.random() - 0.5
    // const randomY = Math.random() - 0.5
    // createSphere(new CANNON.Vec3(randomX, 3, randomY))
    // createSphere(new CANNON.Vec3(randomX, 2.7, randomY))
    // createSphere(new CANNON.Vec3(randomX, 2.4, randomY))

    
    if (Math.floor(elapsedTime % 5) == 0 && Math.floor(elapsedTime) != 0) {
        for (let i = 0; i < HolePosition.length; i++) {
            DrainSphereWaterAllowed[i] = debugObject.DrainSphereWaterAllowed
            AllHoleMesh[i].material.color.set('#ff00ff')
        }
        console.log('Drain limit is replenished')
    }

    if (model && carBody) {
        model.position.copy(carBody.position)
        model.quaternion.copy(carBody.quaternion)
    }

    // Update objects
    for(const object of objectsToUpdate)
    {
        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)

        // Remove object if out of bounds
        if (object.mesh.position.z < -100 || object.mesh.position.z > 100 || object.mesh.position.x < -100 || object.mesh.position.x > 100 || object.mesh.position.y < -20) {
            scene.remove(object.mesh)
            world.removeBody(object.body)
        }


        // Force pulling object into storm sewer
        if (water.geometry.parameters.height <= 4) {
            for (let i = 0; i < HolePosition.length; i++) {
                if (DrainSphereWaterAllowed[i] > 0) {
                    // Apply a force on the object to the middle of another object
                    if (object.mesh.position.y < 1 && object.mesh.position.z > HolePosition[i].z - 4 && object.mesh.position.z < HolePosition[i].z + 4 && object.mesh.position.x > HolePosition[i].x - 4 && object.mesh.position.x < HolePosition[i].x + 4) {
                        const middleOfObject = new CANNON.Vec3().copy(HolePosition[i]);
                        const forceMagnitude = 10 // Replace with the desired force magnitude

                        const force = middleOfObject.vsub(object.body.position).unit().scale(forceMagnitude)
                        object.body.applyForce(force, object.body.position)
                    }

                    // Remove object if at street hole inlet
                    if (object.mesh.position.y < 1 && object.mesh.position.z > HolePosition[i].z - 2 && object.mesh.position.z < HolePosition[i].z + 2 && object.mesh.position.x > HolePosition[i].x - 2 && object.mesh.position.x < HolePosition[i].x + 2) {
                        scene.remove(object.mesh)
                        world.removeBody(object.body)
                        objectsToUpdate.splice(objectsToUpdate.indexOf(object), 1)
                        DrainSphereWaterAllowed[i]--
                        
                        water.geometry.dispose()
                        const newHeight = water.geometry.parameters.height + 0.05
                        water.geometry = new THREE.BoxGeometry(4, newHeight, 101)
                        water.position.y = -17 + newHeight / 2
                    }
                } else {
                    AllHoleMesh[i].material.color.copy(new THREE.Color('#ff0000'))
                }
            }
        } else {
            for (let i = 0; i < HolePosition.length; i++) {
                AllHoleMesh[i].material.color.copy(new THREE.Color('#000000'))
            }
        }
    }

    if (water.geometry.parameters.height > 0) {
        water.geometry.dispose()
        const newHeight = water.geometry.parameters.height - 0.0016
        water.geometry = new THREE.BoxGeometry(4, newHeight, 101)
        water.position.y = -17 + newHeight / 2
    }

    for (let i = 0; i < allBuildingStatus.length; i++) {
        allBuildingStatus[i].rotation.copy(camera.rotation);
    }
    for (let i = 0; i < AllTextMesh.length; i++) {
        if (AllTextMesh[i]) {
            AllTextMesh[i].rotation.copy(camera.rotation);
        }
    }
    for (let i = 0; i < buildingCannon.length; i++) {
        if (buildingCannon[i].collisionCounter > 1) {
            const rednessAmount = (buildingCannon[i].collisionCounter - 2) * 0.03; // Adjust the redness amount as desired
            const redColor = new THREE.Color('#00ff00').lerp(new THREE.Color('#ff0000'), rednessAmount);
            allBuildingStatus[i].material.color.copy(redColor);
        }
        if (buildingCannon[i].collisionCounter >= 70) {
            world.removeBody(buildingCannon[i])
            // scene.remove(allBuilding[i])
        }
    }


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()