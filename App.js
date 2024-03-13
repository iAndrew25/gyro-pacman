import React, {useEffect, useState, useRef} from 'react';
import { TouchableOpacity, StyleSheet, Text, View, SafeAreaView, useWindowDimensions } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import Animated, { runOnJS, useSharedValue, useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';

const filterNoise = value => Math.abs(value) < 0.1 ? 0 : value;

const sensibility = 20;
const opacityOffset = 40;
const scaleOffset = 50;

const stages = 3;
const colsCount = 15;

const dotsDistance = 10;
const dotSize = 30;
const generatedDotsCols = [1,1,1,1,1,3,3,3,3,3,5,5,5,5,5,3,3,3,3,3,1,1,1,1,1];
const generatedBubbles = Array(generatedDotsCols.length)
	.fill(0)
	.reduce((acc) => ([...acc, acc[acc.length - 1] + dotsDistance + dotSize]), [0])

Gyroscope.setUpdateInterval(100);

function DotApp({goBack}) {
	const [isGoingReverse, setIsGoingReverse] = useState(false);
	const setHiddenDots = nextOpacityValue => setIsGoingReverse(!Boolean(nextOpacityValue));

	const sharedRotationY = useSharedValue(1);
	const sharedRotationX = useSharedValue(1);
	const {width: windowWidth} = useWindowDimensions();

	const bubbles = useRef(generatedBubbles.map((x, index, arr) => {
		const translateX = useDerivedValue(() => (windowWidth / 1.2) + x + (sensibility * sharedRotationY.value));
		const translateY = useDerivedValue(() => sensibility * sharedRotationX.value);
		const opacity = useDerivedValue(() => {
			if(isGoingReverse) {
				const nextOpacityValue = (translateX.value - windowWidth / 2 + opacityOffset) > 0 ? 0 : 1;
				if(index === 0) {
					runOnJS(setHiddenDots)(!Boolean(nextOpacityValue));
				}
	
				return nextOpacityValue
			} else {
				const nextOpacityValue = (translateX.value - windowWidth / 2 - opacityOffset) > 0 ? 1 : 0;
				if(index === arr.length - 1 ) {
					runOnJS(setHiddenDots)(Boolean(nextOpacityValue));
				}
	
				return nextOpacityValue
			}
		});
		const scale = useDerivedValue(() => {
			if(isGoingReverse) {
				return translateX.value - windowWidth / 2 + scaleOffset > 0 ? 0.8 : 1;
			} else {
				return translateX.value - windowWidth / 2 - scaleOffset > 0 ? 1 : 0.8;
			}
		});

		const style = useAnimatedStyle(() => ({
			position: 'absolute',
			opacity: withSpring(opacity.value),
			transform: [
				{scale: withSpring(scale.value)},
				{translateY: translateY.value},
				{translateX: translateX.value},
			]
		}));

		return { index, x, style }
	}));

	const [totalRotationY, setTotalRotationY] = useState(0);
	const [totalRotationX, setTotalRotationX] = useState(0);

	useEffect(() => {
		const gyroscopeSubscription = Gyroscope.addListener(({ y }) => {
			const newTotalRotationY = totalRotationY + filterNoise(y);

			setTotalRotationY(newTotalRotationY);
			sharedRotationY.value = newTotalRotationY;
		});

		return gyroscopeSubscription.remove;
	}, [totalRotationY]);

	useEffect(() => {
		const gyroscopeSubscription = Gyroscope.addListener(({ x }) => {
			const newTotalRotationX = totalRotationX + filterNoise(x);
			setTotalRotationX(newTotalRotationX);
			sharedRotationX.value = newTotalRotationX;
		});

		return gyroscopeSubscription.remove;
	}, [totalRotationX]);

	const renderColDots = ({ index, x, style }) => {
		return (
			<Animated.View key={index} style={StyleSheet.compose(style, styles.colDots)}>
				{Array(generatedDotsCols[index]).fill(0).map((_, idx) => (
					<View key={idx} style={styles.dot} />
				))}
			</Animated.View>
		)
	}

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.centerBullet} />

			<View style={StyleSheet.compose(StyleSheet.absoluteFill, styles.dotsContainer)}>
				{bubbles.current.map(renderColDots)}
			</View>

			<View style={styles.logs}>
				<Text style={styles.text}>Y Rotation: {totalRotationY.toFixed(2)}</Text>
				<Text style={styles.text}>X Rotation: {totalRotationX.toFixed(2)}</Text>
				<Text style={styles.text} onPress={goBack}>Go back</Text>
			</View>
		</SafeAreaView>
	);
};

export default function App() {
	const [isDotAppVisible, setIsDotAppVisible] = useState(false);
	const handleOnStart = () => setIsDotAppVisible(true);
	const handleOnGoBack = () => setIsDotAppVisible(false);

	return isDotAppVisible ? <DotApp goBack={handleOnGoBack}/>  : (
		<View style={StyleSheet.compose(styles.container, styles.content)}>
			<Text style={styles.title}>Hold your phone still and press Start when you're ready.</Text>
			<TouchableOpacity style={styles.button} onPress={handleOnStart}>
				<Text style={styles.text}>Start</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#222',
	},
	content: {
		padding: 64
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#ddd',
		textAlign: 'center',
	},
	button: {
		backgroundColor: '#333',
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 10,
		marginTop: 32
	},
	text: {
		fontSize: 18,
		color: '#ddd',
	},
	colDots: {
		flexDirection: 'column',
		alignItems: 'space-between'
	},
	dot: {
		width: dotSize,
		height: dotSize,
		borderRadius: dotSize / 2,
		backgroundColor: '#ddd',
		marginVertical: dotsDistance / 2
	},
	centerBullet: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#ddd'
	},
	logs: {
		position: 'absolute',
		top: 100
	},
	dotsContainer: {
		width: '100%',
		alignItems:'center',
		flexDirection: 'row'
	}
});