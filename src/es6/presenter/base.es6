import {d3} from "nbpresent-deps";

import {SpeakerBase} from "../speaker/base";

import {ManualLayout} from "../layout/manual";
import {TreemapLayout} from "../layout/treemap";

import {PARTS, PART_SELECT} from "../parts";
import {SlabStyle} from "../style/slab";

let PREFIX = [
  "-webkit-",
  "-moz-",
  "-ms-",
  "-o-",
  ""
];

export class Presenter {
  constructor(tree) {
    this.tree = tree;

    this.cellManager = this.makeCellManager();
    this.speaker = this.makeSpeaker(this.tree);

    this.initUI();

    this.presenting = this.tree.select(["presenting"]);
    this.current = this.tree.select(["selectedSlide"]);

    this.tree.on("update", () => this.update());
    this.presenting.on("update", () => this.present());
    this.current.on("update", () => this.update());
  }

  makeCellManager() {
    throw new Error("Not implemented");
  }

  makeSpeaker(tree){
    return new SpeakerBase(tree);
  }

  initUI(){
    this.$ui = d3.select("body")
      .append("div")
      .classed({nbpresent_presenter: 1})
      .style({display: "none"});
  }



  layoutClass(slide){
    return {
      manual: ManualLayout,
      treemap: TreemapLayout
    }[slide.value.layout || "manual"];
  }

  updateLayout(slide){
    let LayoutClass = this.layoutClass(slide);

    if(this.layout &&
      this.layout.key() == LayoutClass.clsKey() &&
      this.layout.slide.key === slide.key
    ){
      this.layout.slide = slide;
    }else{
      this.layout = new LayoutClass(
        this.tree,
        slide,
        document.documentElement
      );
    }
    this.layout.init();
  }

  present() {
    this.update();
  }

  getCells() {
    return this.cellManager.getCells();
  }

  update() {
    let that = this;
    let presenting = this.presenting.get();

    d3.select("body").classed({nbpresent_presenting: presenting});

    this.$ui
      .style({
        "display": presenting ? "block" : "none"
      })
      .style({
        opacity: +presenting,
      });

    let current = this.current.get(),
      slide = this.tree.get(["sortedSlides", (d) => d.key == current]);

    // TODO: handle cleanup
    // transition = this.layout && this.layout.destroy()

    if(!slide){
      return this.current.set(this.tree.get(["sortedSlides", 0, "key"]));
    }

    this.updateLayout(slide);

    if(!presenting){
      return this.clean(true);
    }

    let cells = this.getCells();

    d3.selectAll(this.allPartSelect())
      .classed({nbpresent_unpresent: 1, nbpresent_present: 0});

    d3.entries(slide.value.regions)
      .filter(({value}) => value.content)
      .map((region) => {
        let {content} = region.value,
          cell = cells[content.cell];

        if(!cell){
          return;
        }

        let $el = d3.select(cell.element[0]),
          part = $el.select(PART_SELECT[content.part]);

        part
          .classed({
            nbpresent_unpresent: 0,
            nbpresent_present: 1
          })
          .each(() => that.layout.update(region, part));
        // TODO: now do styles
        d3.entries(region.value.style).map((style) => {
          // TODO: make this extensible

          if(style.value && style.key === "slab"){
            let styler = new SlabStyle();
            styler.update(part);
          }
        })
      });



    this.clean();
  }

  allPartSelect(){
    return d3.entries(PART_SELECT)
      .map(({value}) => `.cell ${value}`)
      .join(", ");
  }

  clean(force){
    let that = this;

    if(force){
      d3.selectAll(this.allPartSelect())
        .classed({nbpresent_unpresent: 1, nbpresent_present: 0});
    }

    d3.selectAll(".nbpresent_unpresent")
      .call(that.layout && this.layout.clean || (() => 0))
      .classed({nbpresent_unpresent: 0, nbpresent_present: 0});
  }
}
