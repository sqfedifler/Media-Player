//这是个工具类
//1）将class类中的- 换成驼峰法 -后的第一个字母为大写
//2）得到鼠标当前位置相对于元素的偏离值（后期用来算进度条用）
//3）格式化播放时间信息
//4）补零
let helpers={
    convertToCamelCase(str) {
        return str.replace(/\-(\w)/g, ($0, $1) => {
            return $1.toUpperCase();
        });
    },
    getDisCursorToElement(el, e){
        let elPos={
              x:el.getBoundingClientRect().x,
              y:el.getBoundingClientRect().y
            }
        return {
            CursorToElX:e.clientX-elPos.x,
            CursorToEly:e.clientY-elPos.y,


        }

    },
    formatDuration(ms){
      let hr=helpers.addZero(parseInt(ms/(3600*1000)));
      let min=helpers.addZero(parseInt(ms%(3600*1000)/(60*1000)));
      let sec=helpers.addZero(parseInt(((ms%(3600*1000))%(60000))/1000));
      let str=hr+":"+min+":"+sec;
      return str;
    },
    addZero(num){
      return num<10?'0'+num:num;

    }


}


class MeidaPlay{
  constructor(videoPlayer){
    this.els={};
    this.els["videoPlayer"]=videoPlayer;
    this.config={
        messageTimer: 0,
        canplay: false,
        bufferedEnd: 0,
        mutedChangeed: false,
        prevClickTimestamp: Date.now(),
        dblClickTimer: 0,
        fullScreenTimer: 0
    };
    //需要用到的元素一次性收录到els对象中
    'video,control,play,time,progress-container,progress-loaded,progress-played,progress-bar,fullscreen,volume,control-volume-box,control-volume-range,control-volume-slider,control-volume-bar,speed,control-speed-box,message'.split(',').forEach( k => {
        this.els[ helpers.convertToCamelCase(k) ] = this.els.videoPlayer.querySelector( '.' + k )
    });
    this.els["controlSpeedList"] = this.els.controlSpeedBox.querySelectorAll('li');
    this.init();
  }
  /**/
  init(){
    //监测视频是否可以播放 ***
    this.els.video.oncanplay = ()=>{
        this.canplay()
    };
    //监测到视频播放时再改变控件样式，注意控件样式改变不是由点击操作而改变，点击操作只执行播放或暂停操作
    this.els.video.onplaying=()=>{
        this.playing()
    }
    //同理，监测到视频暂停时改变控件样式
    this.els.video.onpause=()=>{
        this.pause()
    }
    //播放进度currentTime发生变化时候会触发
    this.els.video.ontimeupdate=()=>{
        this.timeupdate()
    }
    //监测视频正在下载时，触发缓冲进度条改变
    this.els.video.onprogress=()=>{
        this.progress();
    }
    //监测到视频播放速率改变时，改变控件样式，同样鼠标操作只是触发视频速率的实际改变，控件样式的改变在此处触发
    this.els.video.onratechange=()=>{
        this.ratechange();
    }
    //监测到视频音量发生改变时触发控件样式变化
    this.els.video.onvolumechange=()=>{
        this.volumnchange()
    }
    //监测播放进度发生改变，进度条控件也要做出改变（正常播放和鼠标点击均会触发该事件）
    this.els.video.ondurationchange=()=>{
        this.timeupdate();
    }
  }
  //是否可以播放，改变参数标记
  canplay(){
    this.config.canplay=true;
  }

  progress(){
    let buffered=this.els.video.buffered;
    if( buffered.length > 0 ) {
      this.config.bufferedEnd = buffered.end(buffered.length - 1) || 0;
    }
    let containerW=this.els.progressContainer.offsetWidth;
    let v=this.config.bufferedEnd/this.els.video.duration;
    this.els.progressLoaded.style.width=v*containerW+'px';

  }
  
  playOrPause(){
     if(!this.config.canplay){
         return
     }
     //判断视频是否已经暂停，如果暂停就播放，否则就暂停 ***
     this.els.video.paused?this.els.video.play():this.els.video.pause()

  }
//播放时候的控件变化
  playing() {
    this.els.play.classList.remove('play');
    this.els.play.classList.add('pause');
  }

  pause() {
    this.els.play.classList.remove('pause');
    this.els.play.classList.add('play');
  }

  showMessage(str){
    clearTimeout(this.config.messageTimer);
    this.els.message.style.opacity=1;
    this.els.message.innerHTML=str;
    this.config.messageTimer=setTimeout(()=>{
        this.els.message.style.opacity=0;
    },1000)

  }
  //ratechange
  ratechange(){
   this.els.controlSpeedBox.querySelectorAll("li").forEach(item=>{
      if(item.dataset.rate==this.els.video.playbackRate){
         item.classList.add("focus");
      }else{
         item.classList.remove("focus");
      }
   })
  }

    //播放时间发生变化时的行为
  timeupdate(){
    this.els.time.innerHTML=`${helpers.formatDuration(this.els.video.currentTime*1000)} / ${helpers.formatDuration(this.els.video.duration*1000)}`;
        //设置进度
    let v=this.els.video.currentTime/this.els.video.duration;
    let ProcessContainerW=this.els.progressContainer.offsetWidth;
    this.els.progressPlayed.style.width=ProcessContainerW*v+"px";
    let Barleft=ProcessContainerW*v;
    if(Barleft>(ProcessContainerW-this.els.progressBar.clientWidth)){
          Barleft=ProcessContainerW-this.els.progressBar.clientWidth;
    } 
    this.els.progressBar.style.left=Barleft+"px";
   }

  volumnchange(){
   //判断静音全局变量
   if(this.config.mutedChangeed){
     this.els.volume.classList.add("muted");
     this.els.video.muted=true;
     this.showMessage(`静音`)
   }else{
    this.els.volume.classList.remove("muted");
    this.els.video.muted=false;
    //音量条显示
    let vHeight=this.els.controlVolumeRange.offsetHeight;
    this.els.controlVolumeSlider.style.height=(this.els.video.volume*vHeight)+"px";
    this.showMessage(`当前音量：${parseInt(this.els.video.volume*100)}`)
   }
  }

  //videoPalyer上的点击操作，自定义双击操作
  videoPlayTrigger(){
     this.els.videoPlayer.onclick=(e)=>{
       let nowTime=Date.now();
       //通过间隔时间判断双击事件
       if(nowTime-this.config.prevClickTimestamp<500){
        if(e.target==this.els.video){
            clearTimeout(this.config.dblClickTimer)
            this.fullscreen();
         }
       }else{
        if(e.target === this.els.play){
          this.playOrPause();/*** */
         }   
         if(e.target === this.els.video){
          clearTimeout(this.config.dblClickTimer);
          this.config.dblClickTimer=setTimeout(()=>{
             this.playOrPause();/**/
          },600) 
         }


       }
       this.config.prevClickTimestamp=nowTime;

     }

  }


  //改变播放速度
  speedConTrigger(){
    this.els.speed.onmouseenter=()=>{
       this.els.controlSpeedBox.style.display="block";
    }
    this.els.speed.onmouseleave=()=>{
      this.els.controlSpeedBox.style.display="none";
    }
    let This=this;
    this.els.controlSpeedBox.querySelectorAll("li").forEach(item=>{
       item.onclick=function(){
         //**改变了播放速率 */
         This.els.video.playbackRate = this.dataset.rate;
         This.showMessage(`当前速度: ${This.els.video.playbackRate}`)
       }
    })
  }
  
  //改变当前进度
  progressContainerTrigger(){
    let This=this;
    this.els.progressContainer.onclick=function(e){
       let CursorToEl=helpers.getDisCursorToElement(this, e);
       let progressContainerW=this.offsetWidth;
       let v=CursorToEl.CursorToElX/progressContainerW;
       /*改变当前的播放进度 */
       This.els.video.currentTime = This.els.video.duration * v;/**/
       let timeStr=helpers.formatDuration(This.els.video.currentTime*1000);
       let str="当前时间为:"+timeStr;
       This.showMessage(str)
    }
  }

  volumechangeTrigger(){
    let This=this;
    //移入时显示
    this.els.volume.onmouseenter=()=>{
       this.els.controlVolumeBox.style.display="block";
       let v=this.els.video.volume;
       let vHeight=this.els.controlVolumeRange.offsetHeight;
       this.els.controlVolumeSlider.style.height=vHeight*v+"px";
    }
    this.els.volume.onmouseleave=()=>{
       this.els.controlVolumeBox.style.display="none";
    }
    //控制音量,音量条通过事件触发后响应，注意这里是按住不放进行拖曳
    this.els.controlVolumeBar.onmousedown=function(e){
      let vHeight=This.els.controlVolumeRange.offsetHeight;
      This.els.controlVolumeBox.onmousemove=function(e){
          let disY=helpers.getDisCursorToElement(This.els.controlVolumeRange, e).CursorToEly;
          let volumeSideLen=vHeight-disY;
          volumeSideLen=Math.max(0,volumeSideLen);
          volumeSideLen=Math.min(volumeSideLen,vHeight);
          This.config.mutedChangeed=(volumeSideLen==0?true:false);
          This.els.video.volume=volumeSideLen/vHeight;
          return false

      }
      document.onmouseup=function(){
        This.els.controlVolumeBox.onmousemove=null;
        document.onmouseup=null;
      }
    }
    //静音控制
    this.els.volume.onclick=(e)=>{
      if(e.target==this.els.volume){
        if(this.els.video.muted){
          this.els.video.muted=false;
          this.config.mutedChangeed=false;
        }else{
          this.els.video.muted=true;
          this.config.mutedChangeed=true;
        }

      }
    }
  }
  //请求或退出全屏
  fullScrRequestorExit(){
    this.els.fullscreen.onclick=()=>{
      this.fullscreen();
    }
  }

  fullscreen(){
    if (document.fullscreenElement) {
      //请求全屏退出全屏
      document.exitFullscreen();
    } else {
      //请求全屏
      this.els.videoPlayer.requestFullscreen();
    }
  }
  
}

let MP=new MeidaPlay(document.querySelector('#video-player'));
MP.videoPlayTrigger();
MP.progressContainerTrigger();
MP.speedConTrigger();
MP.volumechangeTrigger();
MP.fullScrRequestorExit();



