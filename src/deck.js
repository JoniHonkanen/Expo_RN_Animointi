import React, { Component } from 'react';
import {
    View,
    Animated,
    PanResponder,
    Dimensions,
    LayoutAnimation,
    UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {
    static defaultProps = {
        onSwipeRight: () => { },
        onSwipeLeft: () => { }
    };

    constructor(props) {
        super(props);

        const position = new Animated.ValueXY();

        //ANIMOINTIA VARTEn
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,  // KUN KLIKKAA RUUTUUN
            onPanResponderMove: (event, gesture) => { // kun liikuttaa sormea ruudulla
                console.log({ ...gesture });
                position.setValue({ x: gesture.dx, y: gesture.dy }); // pistaa x ja y paikat animaatiolle
            }, // KUN ALKAA SIIRTAMAAN (DRAG)
            onPanResponderRelease: (event, gesture) => { // kun nostaa sormen ruudulta
                if (gesture.dx > SWIPE_THRESHOLD) {
                    this.forceSwipe('right');
                    console.log('swipe right!')
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    console.log('swipe left!')
                    this.forceSwipe('left');
                } else {
                    this.resetPosition();
                }

            } // KUN SIIRTAMINEN LOPPUU
        });
        this.state = { panResponder, position, index: 0 };
    }

        //UUDEN DATAn TUOMISEEN
    componentWillReceiceProps(nextProps) {
        if (nextProps.data !== this.props.data) {
            this.setState({ index: 0 });
        }
    }

    componentWillUpdate() {
        //ANDROIDILLE ALEMPI PATKA, pakko olla
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true)
        LayoutAnimation.spring();
    }

    forceSwipe(direction) {
        // JOS SUUNTA yhtakuin oikea, return code SCREEN_WIDTH muuten -SCREEN_WIDTH
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(this.state.position, {
            toValue: { x: x, y: 0 },
            duration: SWIPE_OUT_DURATION
        }).start(() => this.onSwipeComplete(direction));
    }

    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];

        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
        //  onSwipeRight tai left ei tee MITAAN, voi itse myohemmin lisata funktion jos haluaa
        this.state.position.setValue({ x: 0, y: 0 });
        this.setState({ index: this.state.index + 1 });
        console.log('suunta: ', direction);
        console.log('ITEMI: ', item)
        console.log('INDEX: ', this.state.index);
    }

    resetPosition() {
        Animated.spring(this.state.position, {
            toValue: { x: 0, y: 0 }
        }).start();
    }

    getCardStyle() {
        const { position } = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5], //Jos vetaa 500 px vasemmalle, kortti on -120 asteen kulassa
            outputRange: ['-120deg', '0deg', '120deg']
        });

        return {
            ...position.getLayout(),
            transform: [{ rotate: rotate }]
        };
    }

    renderCards() {
        // MAHDOLLISTAA LISTAN yhden kortin liikuttelun
        if (this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }

        return this.props.data.map((item, index) => {
            if (index < this.state.index) { return null; }
            if (index === this.state.index) {
                return (
                    <Animated.View
                        key={item.id}
                        style={[this.getCardStyle(), styles.cardStyle, { zIndex: 99 }]}
                        {...this.state.panResponder.panHandlers}
                    >
                        {this.props.renderCard(item)}
                    </Animated.View>
                );
            } else {
                return (
                    <Animated.View key={item.id}
                        style={[styles.cardStyle,
                        { top: 10 * (index - this.state.index), zIndex: 1 }]}>
                        {this.props.renderCard(item)}
                    </Animated.View >
                );
            }
        }).reverse(); //Kaantaa mappauksen 
    }

    render() {
        console.log(this.props);
        // alempi {...this.state pakollinen
        return (
            <View>
                {this.renderCards()}
            </View>
        );
    }
}

const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH,
    }
}

export default Deck;