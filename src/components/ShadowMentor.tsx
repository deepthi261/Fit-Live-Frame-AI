import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface ShadowMentorProps {
    poseData?: any; // Placeholder for future structured pose data
    isRoadblock?: boolean;
}

const ShadowAvatar = ({ poseData, isRoadblock }: ShadowMentorProps) => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Use poseData to drive the avatar (logic will be expanded later)
    if (poseData) {
        // console.log("Real-time pose update:", poseData);
    }
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });

    return (
        <group>
            {/* Abstract human representation using spheres and cylinders */}
            {/* Head */}
            <Sphere args={[0.3, 32, 32]} position={[0, 1.5, 0]}>
                <MeshDistortMaterial
                    color={isRoadblock ? "#ff4444" : "#00f2ff"}
                    speed={isRoadblock ? 10 : 2}
                    distort={0.4}
                    radius={1}
                />
            </Sphere>

            {/* Torso */}
            <mesh position={[0, 0.7, 0]}>
                <capsuleGeometry args={[0.25, 0.8, 4, 16]} />
                <meshStandardMaterial
                    color={isRoadblock ? "#ff4444" : "#00f2ff"}
                    wireframe
                    emissive={isRoadblock ? "#ff4444" : "#00f2ff"}
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Arms Placeholder */}
            <mesh position={[0.5, 1, 0]} rotation={[0, 0, Math.PI / 4]}>
                <capsuleGeometry args={[0.1, 0.5, 4, 16]} />
                <meshStandardMaterial color="#00f2ff" transparent opacity={0.6} />
            </mesh>
            <mesh position={[-0.5, 1, 0]} rotation={[0, 0, -Math.PI / 4]}>
                <capsuleGeometry args={[0.1, 0.5, 4, 16]} />
                <meshStandardMaterial color="#00f2ff" transparent opacity={0.6} />
            </mesh>

            {/* Legs Placeholder */}
            <mesh position={[0.2, -0.2, 0]}>
                <capsuleGeometry args={[0.12, 0.8, 4, 16]} />
                <meshStandardMaterial color="#00f2ff" transparent opacity={0.6} />
            </mesh>
            <mesh position={[-0.2, -0.2, 0]}>
                <capsuleGeometry args={[0.12, 0.8, 4, 16]} />
                <meshStandardMaterial color="#00f2ff" transparent opacity={0.6} />
            </mesh>

            {/* Ground Glow */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial color="#00f2ff" transparent opacity={0.1} />
            </mesh>
        </group>
    );
};

export const ShadowMentor: React.FC<ShadowMentorProps> = (props) => {
    return (
        <div className="w-full h-full min-h-[300px] relative">
            <Canvas camera={{ position: [0, 1, 4], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00f2ff" />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#ffffff" />

                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <ShadowAvatar {...props} />
                </Float>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 3}
                />
            </Canvas>

            {props.isRoadblock && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-[2px] pointer-events-none">
                    <div className="bg-red-600 text-white px-4 py-2 rounded-full font-black text-xl animate-bounce shadow-2xl">
                        🚧 FORM BREACH! 🚧
                    </div>
                </div>
            )}
        </div>
    );
};
