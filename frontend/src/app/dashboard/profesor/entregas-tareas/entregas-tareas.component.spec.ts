import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntregasTareasComponent } from './entregas-tareas.component';

describe('EntregasTareasComponent', () => {
  let component: EntregasTareasComponent;
  let fixture: ComponentFixture<EntregasTareasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntregasTareasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EntregasTareasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
