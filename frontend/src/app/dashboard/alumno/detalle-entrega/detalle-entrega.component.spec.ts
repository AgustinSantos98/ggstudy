import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleEntregaComponent } from './detalle-entrega.component';

describe('DetalleEntregaComponent', () => {
  let component: DetalleEntregaComponent;
  let fixture: ComponentFixture<DetalleEntregaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleEntregaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleEntregaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
