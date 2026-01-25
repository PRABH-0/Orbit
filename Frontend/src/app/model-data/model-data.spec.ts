import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelData } from './model-data';

describe('ModelData', () => {
  let component: ModelData;
  let fixture: ComponentFixture<ModelData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelData);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
