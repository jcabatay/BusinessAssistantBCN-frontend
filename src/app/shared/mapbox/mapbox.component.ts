import { Component, AfterViewInit, ViewChild, ElementRef, Input } from "@angular/core";
import Mapboxgl, { LngLatBounds, NavigationControl, GeolocateControl, Map, Popup, Marker } from "mapbox-gl";
import { BusinessWithAddressModel } from "src/app/models/common/businessWithAddressModel.model";

@Component({
  selector: "app-mapbox",
  templateUrl: "./mapbox.component.html",
  styleUrls: ["./mapbox.component.css"],
})
export class MapboxComponent implements AfterViewInit {
  @ViewChild("mapDiv")
  mapDivElement!: ElementRef;
  @Input() filteredResultsToPrintOnMap!: BusinessWithAddressModel[];
  private map!: Map;
  private currentMarkers: Marker[] = [];

  private MAPBOX_TOKEN: string = 'pk.eyJ1IjoianZyZnJlZWxhbmNlZGV2ZWxvcGVyIiwiYSI6ImNreTl4czUzMTAwNGQydnFsdmRhYXRvbDUifQ.TVL-2T184QdfXbze6VNw4A';
  private MAPBOX_STYLE: string = 'mapbox://styles/mapbox/streets-v11';
  private MAPBOX_ZOOM: number = 8;
  private MAPBOX_ITAcademy_OBJECT: BusinessWithAddressModel = {
    name: "IT Academy",
    web: "bcn.cat/barcelonactiva",
    email: "itacademy@barcelonactiva.cat",
    phone: 932917610,
    activities: [],
    addresses: [
      {
        street_name: "Roc Boronat",
        number: "117-127",
        zip_code: "08018",
        district_id: "04",
        town: "BARCELONA",
        location: {
          x: 2.194060007737955,
          y: 41.40389733660671,
        },
      },
    ],
  }

  constructor() { }

  ngAfterViewInit(): void {
    // Generate map with basic config
    this.generateMap();
    // Depending on if the user accepts to share their location, center the map into the user, or into the default location (IT Academy)
    this.getUsersLocation();
  }

  ngOnChanges() {
    this.filteredResultsToPrintOnMap.forEach((result) => {
      // Create a marker for each result and add it to the map
      this.createANewMarker("orange", result);
    });
  }

  ngOnDestroy() {
    this.currentMarkers.forEach(marker => marker.remove());
  }

  generateMap() {
    Mapboxgl.accessToken = this.MAPBOX_TOKEN;
    this.map = new Map({
      container: this.mapDivElement.nativeElement,
      style: this.MAPBOX_STYLE,  // style URL }
      center: [this.MAPBOX_ITAcademy_OBJECT.addresses[0].location.x, this.MAPBOX_ITAcademy_OBJECT.addresses[0].location.y], // starting center so it doesn't start from Germany
      zoom: this.MAPBOX_ZOOM
    });

    this.map.addControl(new NavigationControl());

    // Add geolocate control to the map.
    this.map.addControl(
      new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      })
    );
  }

  // Function to create a single marker (with the marker's colour and the business (or user's coords) as parameters)
  createANewMarker(markerColor: string, business?: BusinessWithAddressModel, coord?: GeolocationCoordinates): void {

    // Create a popup with the business's basic information
    const popup = new Popup().setHTML(
      `<b>${business?.name}</b> </br> ${business?.addresses[0].street_name} , ${business?.addresses[0].number}`
    );

    if (coord) { // If user has accepted to share their location
      const newIndividualMarker = new Marker({ color: markerColor })
        .setLngLat([coord.longitude, coord.latitude])
        .addTo(this.map);
      this.currentMarkers.push(newIndividualMarker);
    } else { // If user hasn't accepted to share their location OR when iterating through the filteredResultsToPrintOnMap array.
      const newIndividualMarker = new Marker({ color: markerColor })
        .setLngLat([business!.addresses[0].location.x, business!.addresses[0].location.y])
        .setPopup(popup)
        .addTo(this.map);
      this.currentMarkers.push(newIndividualMarker);
    }

    // MAP LÍMITS
    // Initial point 0
    const bounds = new LngLatBounds();

    // Add all the markers to the map's bounds. 
    this.currentMarkers.forEach(marker =>
      bounds.extend(marker.getLngLat()));

    // Adjust the zoom to see all the existing markers
    this.map.fitBounds(bounds, {
      padding: 75
    })
  }

  getUsersLocation(): void {
    navigator.geolocation.getCurrentPosition(
      // Success callback function (if user has accepted to share their location)
      (pos) => {
        // this.map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 11 })
        this.createANewMarker("green", undefined, pos.coords);
      },
      // Error callback function (if user hasn't accepted to share their location)
      () => {
        // this.map.flyTo(
        //   { center: [environment.MAPBOX_ITAcademy_OBJECT.addresses[0].location.x, environment.MAPBOX_ITAcademy_OBJECT.addresses[0].location.y], zoom: 11 })
        this.createANewMarker("red", this.MAPBOX_ITAcademy_OBJECT);
      }
    );
  }
}
