import React, {useEffect, useState, useRef} from 'react';
import { StyleSheet, Text,Button, View, SafeAreaView, useWindowDimensions } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import Animated, { useSharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

const filterNoise = value => Math.abs(value) < 0.1 ? 0 : value;

const baseValue = 100;
const baseDistanceBetweenBubbles = 300;
const multiplier = 1;

const getRandomValue = (min, max) => Math.random() * (max - min) + min;

const generatedBubbles = Array(30)
	.fill(0)
	.reduce((acc) => ([...acc, acc[acc.length - 1] + getRandomValue(50, 150)]), [0])

Gyroscope.setUpdateInterval(100);

export default function App() {
	const sharedRotation = useSharedValue(1);
	const bubbles = useRef(generatedBubbles.map((x, index) => {
		const translateX = useDerivedValue(() => x + (baseDistanceBetweenBubbles * sharedRotation.value));
		const style = useAnimatedStyle(() => ({
			transform: [
				{translateX: translateX.value}
			]
		}));

		return { index, x, style }
	}));
	
	const {width: windowWidth} = useWindowDimensions();
	const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
	const [totalRotation, setTotalRotation] = useState(0);
	const [degrees, setDegrees] = useState(0);

	useEffect(() => {
		
		const gyroscopeSubscription = Gyroscope.addListener(({ x, y, z }) => {
			setRotation({ x, y, z });
			
			const newTotalRotation = totalRotation + (multiplier * filterNoise(y));
			const totalDegrees = filterNoise(newTotalRotation) * (180 / Math.PI);
			setTotalRotation(newTotalRotation);
			setDegrees(totalDegrees);

			sharedRotation.value = newTotalRotation;
		});

		return () => {
			gyroscopeSubscription.remove();
		};
	}, [totalRotation]);

	return (
		<SafeAreaView style={styles.container}>
			<View style={{width: '100%', height: 100}}>
				{bubbles.current.map(({ index, x, style }, key, arr) => (
					<Animated.View
						key={index}
						style={StyleSheet.compose(style, {
							width: 40,
							height: 40,
							borderRadius: 20,
							borderWidth: 2,
							borderColor: 'blue',
							position: 'absolute',
							justifyContent: 'center',
							alignItems: 'center',
							backgroundColor: key === 0 ? 'green' : key === arr.length - 1 ? 'red' : 'transparent',
						})}
					>
						<Text>{x.toFixed(0)}</Text>
					</Animated.View>
				))}
			</View>

			<Text style={styles.text}>Total Y Degrees: {degrees}</Text>
			<Text style={styles.text}>Total Y Rotation: {totalRotation.toFixed(2)}</Text>
			<Text style={styles.text}>Rotation Y: {rotation.y.toFixed(2)}</Text>
		</SafeAreaView>
	);
};


const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	text: {
		fontSize: 18,
		marginBottom: 10,
	},
});