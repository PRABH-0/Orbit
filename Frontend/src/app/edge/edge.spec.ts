import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Edge } from './edge';

describe('Edge', () => {
  let component: Edge;
  let fixture: ComponentFixture<Edge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Edge]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Edge);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
