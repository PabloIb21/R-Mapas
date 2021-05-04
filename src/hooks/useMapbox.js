import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { v4 } from 'uuid';
import { Subject } from 'rxjs';

mapboxgl.accessToken = 'pk.eyJ1IjoicGFibG9pYjIxIiwiYSI6ImNrbzU2c3YxcTAwOG4ydm9hZWJ5bmtnbzcifQ.mqmp113QpqmGAs6uMrFNVw';

export const useMapbox = ( puntoInicial ) => {

    // Referencia al div del mapa
    const mapaDiv = useRef();
    const setRef = useCallback( node => {
        mapaDiv.current = node;
    },[]);

    // Referencia a los marcadores
    const marcadores = useRef({});

    // Observables de Rxjs
    const movimientoMarcador = useRef( new Subject() );
    const nuevoMarcador = useRef( new Subject() );

    // Mapa y coords
    const mapa = useRef();
    const [ coords, setCoords ] = useState( puntoInicial );

    // Función para agregar marcador
    const agregarMarcador = useCallback( (e, id) => {
        const { lng, lat } = e.lngLat || e;

        const marker = new mapboxgl.Marker();
        marker.id = id ?? v4();

        marker
            .setLngLat([ lng, lat ])
            .addTo( mapa.current )
            .setDraggable( true );

        // Asignamos el objeto de marcadores
        marcadores.current[ marker.id ] = marker;

        // Si el marcador tiene ID no emitir
        if ( !id ) {
            nuevoMarcador.current.next({
                id: marker.id,
                lng,
                lat
            });
        }

        // Escuchar movimientos del marcador
        marker.on('drag', ({ target }) => {
            const { id } = target;
            const { lng, lat } = target.getLngLat();
            movimientoMarcador.current.next({ id, lng, lat });
        });
    },[]);

    // Función para actualizar marcador
    const actualizarMarcador = useCallback( ({ id, lng, lat }) => {
        marcadores.current[id].setLngLat([ lng, lat ]);
    }, []);

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: mapaDiv.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [ puntoInicial.lng, puntoInicial.lat ],
            zoom: puntoInicial.zoom
        });

        mapa.current = map;
    }, [ puntoInicial ]);

    // Cuando se mueve el mapa
    useEffect(() => {
        
        mapa.current?.on('move', () => {
            const { lng, lat } = mapa.current.getCenter();
            setCoords({
                lng: lng.toFixed(4),
                lat: lat.toFixed(4),
                zoom: mapa.current.getZoom().toFixed(4)
            });
        });
        
    }, []);

    // Agregar marcadores cuando hago click
    useEffect(() => {
        
        mapa.current?.on('click', e => {
            agregarMarcador( e );
        });

    }, [agregarMarcador]);

    return {
        agregarMarcador,
        actualizarMarcador,
        coords,
        marcadores,
        movimientoMarcador$: movimientoMarcador.current,
        nuevoMarcador$: nuevoMarcador.current,
        setRef
    }
}
